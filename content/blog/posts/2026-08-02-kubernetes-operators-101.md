---
title: "Kubernetes Operators 101"
slug: "kubernetes-operators-101"
date: "2026-08-02"
tags: ["kubernetes", "distributed-systems"]
excerpt: "What Kubernetes operators actually are, why CRDs and controllers exist, and a concrete look at a reconciliation loop in action."
draft: false
---

Kubernetes ships with a fixed vocabulary of built-in objects: Pods, Services, Deployments, ConfigMaps. That vocabulary covers a huge share of what you need to run stateless workloads, but it has nothing to say about the operational knowledge required to run, say, a PostgreSQL cluster with replication and failover, or a Kafka cluster with careful broker rebalancing. An operator is how you teach Kubernetes that missing vocabulary. It is a piece of software, running inside the cluster, that extends the Kubernetes API with a new kind of object and then continuously works to make the real world match what that object describes.

The mechanism behind this has two halves. The first is a Custom Resource Definition, or CRD, which registers a new resource type with the API server. Once a CRD for, say, `PostgresCluster` exists, you can `kubectl apply` a YAML manifest describing a `PostgresCluster` the same way you would a Deployment, and the API server will store it, validate it against a schema, and serve it back through the normal Kubernetes API. On its own a CRD is inert — it's just structured storage. The second half is the controller: a process that watches for `PostgresCluster` objects and does whatever work is needed to bring the cluster's actual state in line with the object's desired state. The combination of a CRD plus a controller written to manage it is what people mean by "an operator."

The core of every controller is the reconciliation loop, and it's worth walking through concretely because the pattern is deceptively simple and shows up everywhere in Kubernetes' own internals, not just in third-party operators. A reconciler is a function that takes the identity of one object — say, `PostgresCluster "orders-db"` — and does three things: read the object's current spec (the desired state, as the user wrote it), read the current state of the world (query the actual StatefulSet, Pods, and PersistentVolumeClaims that back this cluster), and then compute and apply whatever changes close the gap between the two. Critically, the loop does not try to be clever about *what changed* since the last run. It re-derives the correct action from scratch every time it fires, which is what makes it resilient to missed events, restarts, and races — if the controller crashes mid-reconciliation, the next run just recomputes the diff and continues, with no lost state to recover.

Concretely: suppose the `orders-db` `PostgresCluster` spec says `replicas: 3`, but a node failure has taken one Postgres Pod down, leaving only 2 running. The controller's watch mechanism receives an update event (in this case, a Pod deletion), which enqueues `orders-db` for reconciliation. The reconciler reads the spec (`replicas: 3`), lists the actual Pods matching that cluster's labels (finds 2), and sees a gap. It doesn't just naively scale up, though — a real Postgres operator has to reason about roles too, so it checks whether the missing Pod was the primary or a replica. If it was a replica, the controller creates a new Pod, waits for it to join as a streaming replica, and updates the `PostgresCluster` status subresource to reflect the current member list. If it was the primary, the controller has more to do: promote one of the remaining replicas, update the Service selector or connection secret that points application traffic at the primary, and only then create a replacement Pod to rejoin as a new replica. Either way, the loop runs again on the next event — or on a periodic resync — and if everything already matches the desired state, it does nothing at all. That idempotence is the whole point: operators encode operational runbooks as code that keeps re-checking its own work, rather than as one-shot scripts that assume the world stood still while they ran.

Stripped to its essentials, a reconciler for this looks roughly like the sketch below — read desired state, read actual state, diff, act:

```go
func (r *PostgresClusterReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	var cluster postgresv1.PostgresCluster
	if err := r.Get(ctx, req.NamespacedName, &cluster); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var pods corev1.PodList
	if err := r.List(ctx, &pods, client.MatchingLabels(cluster.PodLabels())); err != nil {
		return ctrl.Result{}, err
	}

	desired := cluster.Spec.Replicas
	actual := len(pods.Items)

	if actual == desired {
		return ctrl.Result{}, nil // nothing to do — already converged
	}

	if primaryMissing(pods, cluster) {
		if err := r.promoteReplica(ctx, &cluster, pods); err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, r.createReplacementPod(ctx, &cluster)
}
```

Nothing here tracks *what changed since last time* — every invocation starts from the same two reads and recomputes the gap, which is exactly what makes it safe to re-run after a crash, a missed watch event, or a plain periodic resync.
