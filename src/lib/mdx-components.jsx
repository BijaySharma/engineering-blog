import { Mermaid } from "@/components/Mermaid";

function getCodeChild(preProps) {
  const child = preProps.children;
  return child && child.props && child.props.className ? child : null;
}

export const mdxComponents = {
  h1: (props) => (
    <h1 className="font-serif text-3xl mt-12 mb-6" {...props} />
  ),
  h2: (props) => <h2 className="font-serif text-2xl mt-10 mb-4" {...props} />,
  h3: (props) => (
    <h3 className="font-serif text-xl mt-8 mb-3" {...props} />
  ),
  p: (props) => <p className="text-base leading-relaxed mb-5" {...props} />,
  a: (props) => (
    <a
      className="text-accent underline underline-offset-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className="list-disc pl-6 mb-5 space-y-2" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal pl-6 mb-5 space-y-2" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  pre: (props) => {
    const codeChild = getCodeChild(props);
    if (codeChild && codeChild.props.className.includes("language-mermaid")) {
      return <Mermaid chart={codeChild.props.children} />;
    }
    return (
      <pre
        className="rounded-md border border-border bg-muted/30 p-4 overflow-x-auto mb-6"
        {...props}
      />
    );
  },
  code: (props) => {
    // Fenced code blocks are rendered as <pre><code className="language-*">
    // by rehype-highlight; inline code has no className. Only style inline
    // code here — block styling (background, border, padding) lives on `pre`.
    if (props.className) {
      return <code {...props} />;
    }
    return (
      <code
        className="rounded bg-muted/40 px-1.5 py-0.5 text-sm"
        {...props}
      />
    );
  },
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-accent pl-4 italic text-muted"
      {...props}
    />
  ),
  img: (props) => (
    // alt text comes from the markdown image syntax via spread props below.
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      className="rounded-md border border-border my-6 max-w-full"
      {...props}
    />
  ),
  Callout: (props) => (
    <aside
      className="rounded-md border border-accent bg-accent/10 px-4 py-3 my-6 text-sm"
      {...props}
    />
  ),
};
