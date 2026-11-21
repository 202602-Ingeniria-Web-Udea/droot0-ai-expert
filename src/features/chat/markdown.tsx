"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import "./markdown.css";

/** react-markdown passes the syntax-tree `node` to components; it must not reach the DOM. */
function domProps<Props extends { node?: unknown }>(props: Props): Omit<Props, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

const components: Components = {
  pre(props) {
    return <CodeBlock {...domProps(props)} />;
  },
  a(props) {
    const { href, children, ...rest } = domProps(props);
    const external = /^https?:\/\//i.test(href ?? "");

    return (
      <a
        href={href}
        // External links open in a new tab and cannot reach back to this page.
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
  table(props) {
    // Wide tables scroll inside their own container instead of the page.
    return (
      <div className="overflow-x-auto">
        <table {...domProps(props)} />
      </div>
    );
  },
};

/**
 * Renders Markdown (with GitHub Flavored Markdown) as React elements.
 *
 * Safety: raw HTML in the content is NOT parsed (no `rehype-raw`, no
 * `dangerouslySetInnerHTML`), so tags such as <script> appear as plain text,
 * and react-markdown drops unsafe URL protocols such as `javascript:`.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
