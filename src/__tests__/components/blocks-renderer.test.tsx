// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

import { BlocksRenderer, renderInlineNodes } from "@/components/blocks-renderer";
import type { StrapiBlock, StrapiInlineNode } from "@/lib/strapi-client";

afterEach(cleanup);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function text(t: string, mods: Partial<Omit<import("@/lib/strapi-client").StrapiTextNode, "type" | "text">> = {}): import("@/lib/strapi-client").StrapiTextNode {
  return { type: "text", text: t, ...mods };
}

function paragraph(children: StrapiInlineNode[]): StrapiBlock {
  return { type: "paragraph", children };
}

function heading(level: 1 | 2 | 3 | 4 | 5 | 6, children: StrapiInlineNode[]): StrapiBlock {
  return { type: "heading", level, children };
}

// ─── renderInlineNodes ────────────────────────────────────────────────────────

describe("renderInlineNodes", () => {
  it("renders plain text", () => {
    const { container } = render(<>{renderInlineNodes([text("Hello")])}</>);
    expect(container).toHaveTextContent("Hello");
  });

  it("renders bold text in <strong>", () => {
    const { container } = render(<>{renderInlineNodes([text("Bold", { bold: true })])}</>);
    expect(container.querySelector("strong")).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("Bold");
  });

  it("renders italic text in <em>", () => {
    const { container } = render(<>{renderInlineNodes([text("Italic", { italic: true })])}</>);
    expect(container.querySelector("em")).toBeInTheDocument();
  });

  it("renders underline text in <u>", () => {
    const { container } = render(<>{renderInlineNodes([text("Under", { underline: true })])}</>);
    expect(container.querySelector("u")).toBeInTheDocument();
  });

  it("renders strikethrough in <s>", () => {
    const { container } = render(<>{renderInlineNodes([text("Strike", { strikethrough: true })])}</>);
    expect(container.querySelector("s")).toBeInTheDocument();
  });

  it("renders inline code in <code>", () => {
    const { container } = render(<>{renderInlineNodes([text("code()", { code: true })])}</>);
    expect(container.querySelector("code")).toBeInTheDocument();
    expect(container.querySelector("code")).toHaveTextContent("code()");
  });

  it("renders links with href and target=_blank for external", () => {
    const nodes: StrapiInlineNode[] = [
      {
        type: "link",
        url: "https://example.com",
        children: [text("Click me")],
      },
    ];
    const { container } = render(<>{renderInlineNodes(nodes)}</>);
    const a = container.querySelector("a");
    expect(a).toBeInTheDocument();
    expect(a).toHaveAttribute("href", "https://example.com");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveTextContent("Click me");
  });

  it("renders internal links without target=_blank", () => {
    const nodes: StrapiInlineNode[] = [
      { type: "link", url: "/about", children: [text("About")] },
    ];
    const { container } = render(<>{renderInlineNodes(nodes)}</>);
    const a = container.querySelector("a");
    expect(a).not.toHaveAttribute("target");
  });
});

// ─── BlocksRenderer ───────────────────────────────────────────────────────────

describe("BlocksRenderer — paragraph", () => {
  it("renders a paragraph with text", () => {
    render(<BlocksRenderer blocks={[paragraph([text("Hello world")])]} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});

describe("BlocksRenderer — heading", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)("renders h%i", (level) => {
    const { container } = render(
      <BlocksRenderer blocks={[heading(level, [text(`Heading ${level}`)])]} />
    );
    expect(container.querySelector(`h${level}`)).toHaveTextContent(`Heading ${level}`);
  });
});

describe("BlocksRenderer — list", () => {
  it("renders unordered list", () => {
    const block: StrapiBlock = {
      type: "list",
      format: "unordered",
      children: [
        { type: "list-item", children: [text("Item A")] },
        { type: "list-item", children: [text("Item B")] },
      ],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
  });

  it("renders ordered list as <ol>", () => {
    const block: StrapiBlock = {
      type: "list",
      format: "ordered",
      children: [{ type: "list-item", children: [text("Step 1")] }],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    expect(container.querySelector("ol")).toBeInTheDocument();
  });
});

describe("BlocksRenderer — quote", () => {
  it("renders a blockquote", () => {
    const block: StrapiBlock = {
      type: "quote",
      children: [text("A wise saying")],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    expect(container.querySelector("blockquote")).toHaveTextContent("A wise saying");
  });
});

describe("BlocksRenderer — code", () => {
  it("renders a code block inside <pre><code>", () => {
    const block: StrapiBlock = {
      type: "code",
      children: [{ type: "text", text: "const x = 1;" }],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    expect(container.querySelector("pre code")).toHaveTextContent("const x = 1;");
  });
});

describe("BlocksRenderer — image", () => {
  it("renders an image with alt text", () => {
    const block: StrapiBlock = {
      type: "image",
      image: {
        url: "https://cdn.example.com/photo.jpg",
        alternativeText: "A photo",
        width: 800,
        height: 600,
      },
      children: [],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "A photo");
  });

  it("renders image without dimensions using fill approach", () => {
    const block: StrapiBlock = {
      type: "image",
      image: {
        url: "/uploads/photo.jpg",
        alternativeText: null,
      },
      children: [],
    };
    const { container } = render(<BlocksRenderer blocks={[block]} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
  });
});

describe("BlocksRenderer — snapshot", () => {
  it("renders a complex composition consistently", () => {
    const blocks: StrapiBlock[] = [
      heading(1, [text("My Article")]),
      paragraph([text("Some "), text("bold", { bold: true }), text(" text with "), text("code()", { code: true })]),
      {
        type: "list",
        format: "unordered",
        children: [
          { type: "list-item", children: [text("First")] },
          { type: "list-item", children: [text("Second")] },
        ],
      },
      { type: "quote", children: [text("Inspirational quote")] },
      { type: "code", children: [{ type: "text", text: "npm install" }] },
    ];
    const { container } = render(<BlocksRenderer blocks={blocks} />);
    expect(container).toMatchSnapshot();
  });
});
