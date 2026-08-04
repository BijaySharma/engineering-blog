"use client";

import { useEffect, useId, useRef } from "react";

// mermaid needs a real DOM + unique id per diagram, so this renders client-side
// only. RSC's <MDXRemote> can still emit this as a component reference from
// a server-rendered tree — the "use client" boundary handles the hop.
export function Mermaid({ chart }) {
  const containerRef = useRef(null);
  const id = useId().replace(/:/g, "-");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });

      const { svg } = await mermaid.render(`mermaid-${id}`, chart);
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="mermaid my-6 flex justify-center overflow-x-auto rounded-md border border-border bg-background p-4"
    />
  );
}
