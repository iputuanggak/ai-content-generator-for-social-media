/**
 * BlocksRenderer — maps Strapi v5 Blocks JSON to styled React components.
 *
 * Supported block types: paragraph, heading (1-6), list (ordered/unordered),
 * quote, image, code.
 * Inline formatting: bold, italic, underline, strikethrough, code, links.
 */

import React from "react";
import Image from "next/image";
import {
  StrapiBlock,
  StrapiInlineNode,
  StrapiTextNode,
  StrapiLinkNode,
} from "@/lib/strapi-client";

// ─── Inline Renderer ──────────────────────────────────────────────────────────

function renderTextNode(node: StrapiTextNode, key: number): React.ReactNode {
  let content: React.ReactNode = node.text;

  if (node.code) {
    content = (
      <code
        key={key}
        className="rounded px-1 py-0.5 text-sm font-mono"
        style={{
          background: "oklch(0.20 0.04 170)",
          color: "oklch(0.75 0.14 170)",
        }}
      >
        {content}
      </code>
    );
    return content;
  }
  if (node.bold) content = <strong key={key}>{content}</strong>;
  if (node.italic) content = <em key={key}>{content}</em>;
  if (node.underline) content = <u key={key}>{content}</u>;
  if (node.strikethrough) content = <s key={key}>{content}</s>;

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function renderLinkNode(node: StrapiLinkNode, key: number): React.ReactNode {
  return (
    <a
      key={key}
      href={node.url}
      target={node.url.startsWith("http") ? "_blank" : undefined}
      rel={node.url.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{ color: "oklch(0.65 0.14 170)" }}
      className="underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {node.children.map((child, i) => renderTextNode(child, i))}
    </a>
  );
}

export function renderInlineNodes(nodes: StrapiInlineNode[]): React.ReactNode {
  return nodes.map((node, i) => {
    if (node.type === "link") return renderLinkNode(node as StrapiLinkNode, i);
    return renderTextNode(node as StrapiTextNode, i);
  });
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function ParagraphBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "paragraph" }>;
}) {
  return (
    <p className="text-white/80 leading-relaxed mb-6">
      {renderInlineNodes(block.children)}
    </p>
  );
}

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingClasses: Record<number, string> = {
  1: "font-heading text-4xl text-white mt-10 mb-4",
  2: "font-heading text-3xl text-white mt-8 mb-4",
  3: "font-heading text-2xl text-white mt-6 mb-3",
  4: "font-heading text-xl text-white mt-6 mb-3",
  5: "font-heading text-lg text-white mt-4 mb-2",
  6: "font-heading text-base text-white mt-4 mb-2",
};

function HeadingBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "heading" }>;
}) {
  const Tag = `h${block.level}` as HeadingTag;
  return (
    <Tag className={headingClasses[block.level]}>
      {renderInlineNodes(block.children)}
    </Tag>
  );
}

function ListBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "list" }>;
}) {
  const Tag = block.format === "ordered" ? "ol" : "ul";
  return (
    <Tag
      className={`mb-6 pl-6 text-white/80 leading-relaxed space-y-1 ${
        block.format === "ordered" ? "list-decimal" : "list-disc"
      }`}
    >
      {block.children.map((item, i) => (
        <li key={i}>{renderInlineNodes(item.children)}</li>
      ))}
    </Tag>
  );
}

function QuoteBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "quote" }>;
}) {
  return (
    <blockquote
      className="my-6 pl-5 py-2 text-white/70 italic text-lg leading-relaxed"
      style={{
        borderLeft: "3px solid oklch(0.55 0.14 170)",
      }}
    >
      {renderInlineNodes(block.children)}
    </blockquote>
  );
}

function CodeBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "code" }>;
}) {
  const code = block.children.map((c) => c.text).join("");
  return (
    <pre
      className="rounded-xl p-5 mb-6 overflow-x-auto text-sm font-mono leading-relaxed"
      style={{
        background: "oklch(0.16 0.04 170)",
        border: "1px solid oklch(0.26 0.06 170)",
        color: "oklch(0.80 0.08 170)",
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

function ImageBlock({
  block,
}: {
  block: Extract<StrapiBlock, { type: "image" }>;
}) {
  const { url, alternativeText, width, height } = block.image;
  const src = url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;

  if (width && height) {
    return (
      <figure className="my-8">
        <Image
          src={src}
          alt={alternativeText ?? ""}
          width={width}
          height={height}
          className="rounded-xl w-full h-auto"
        />
      </figure>
    );
  }

  return (
    <figure className="my-8 relative w-full" style={{ paddingBottom: "56.25%" }}>
      <Image
        src={src}
        alt={alternativeText ?? ""}
        fill
        className="rounded-xl object-cover"
      />
    </figure>
  );
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

interface BlocksRendererProps {
  blocks: StrapiBlock[];
}

export function BlocksRenderer({ blocks }: BlocksRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return <ParagraphBlock key={i} block={block} />;
          case "heading":
            return <HeadingBlock key={i} block={block} />;
          case "list":
            return <ListBlock key={i} block={block} />;
          case "quote":
            return <QuoteBlock key={i} block={block} />;
          case "code":
            return <CodeBlock key={i} block={block} />;
          case "image":
            return <ImageBlock key={i} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
