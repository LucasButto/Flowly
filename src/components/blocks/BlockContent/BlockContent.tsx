"use client";
import { type ReactNode } from "react";
import type { NoteBlock } from "@/types/blocks";
import "./BlockContent.scss";

interface InlineRule {
  re: RegExp;
  render: (m: RegExpExecArray, key: string) => ReactNode;
}

// Reglas inline. Se elige siempre el match más temprano del texto.
const INLINE_RULES: InlineRule[] = [
  {
    // **negrita**
    re: /\*\*([^*]+?)\*\*/,
    render: (m, k) => <strong key={k}>{parseInline(m[1] ?? "", k)}</strong>,
  },
  {
    // ~~tachado~~
    re: /~~([^~]+?)~~/,
    render: (m, k) => <del key={k}>{parseInline(m[1] ?? "", k)}</del>,
  },
  {
    // _itálica_  (con bordes de palabra para no romper URLs o snake_case)
    re: /(?<![\w*])_([^_]+?)_(?![\w*])/,
    render: (m, k) => <em key={k}>{parseInline(m[1] ?? "", k)}</em>,
  },
  {
    // links
    re: /(https?:\/\/[^\s<>"')\]]+)/,
    render: (m, k) => (
      <a
        key={k}
        href={m[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="blocks-view__link"
        onClick={(e) => e.stopPropagation()}
      >
        {(m[1] ?? "").replace(/^https?:\/\/(www\.)?/, "")}
      </a>
    ),
  },
];

/** Parser inline recursivo: negrita, itálica, tachado y links anidables. */
function parseInline(text: string, keyBase = "k"): ReactNode[] {
  let best: { rule: InlineRule; m: RegExpExecArray } | null = null;
  for (const rule of INLINE_RULES) {
    const m = rule.re.exec(text);
    if (m && (best === null || m.index < best.m.index)) best = { rule, m };
  }
  if (!best) return text ? [text] : [];

  const { rule, m } = best;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);
  const nodes: ReactNode[] = [];
  if (before) nodes.push(before);
  nodes.push(rule.render(m, `${keyBase}-${m.index}`));
  nodes.push(...parseInline(after, `${keyBase}-${m.index}a`));
  return nodes;
}

/** Texto con formato inline (negrita/itálica/tachado) y links clicables. */
export function RichText({ text }: { text: string }) {
  return <>{parseInline(text)}</>;
}

interface BlockContentProps {
  blocks: NoteBlock[];
  /** Si está, los checklists se pueden marcar desde la vista. */
  onToggleCheck?: (block: NoteBlock) => void;
}

/** Vista read-only de bloques: notas, descripciones de tareas, etc. */
export default function BlockContent({
  blocks,
  onToggleCheck,
}: BlockContentProps) {
  let numIdx = 0;

  return (
    <div className="blocks-view">
      {blocks.map((block) => {
        numIdx = block.type === "number" ? numIdx + 1 : 0;
        switch (block.type) {
          case "h1":
            return (
              <h4 key={block.id} className="blocks-view__h1">
                <RichText text={block.text} />
              </h4>
            );
          case "h2":
            return (
              <h5 key={block.id} className="blocks-view__h2">
                <RichText text={block.text} />
              </h5>
            );
          case "bullet":
            return (
              <p key={block.id} className="blocks-view__li">
                <span className="blocks-view__dot" />
                <span>
                  <RichText text={block.text} />
                </span>
              </p>
            );
          case "number":
            return (
              <p key={block.id} className="blocks-view__li">
                <span className="blocks-view__num">{numIdx}.</span>
                <span>
                  <RichText text={block.text} />
                </span>
              </p>
            );
          case "check":
            return (
              <p key={block.id} className="blocks-view__li">
                <button
                  type="button"
                  className={`blocks-view__check ${
                    block.checked ? "blocks-view__check--on" : ""
                  }`}
                  disabled={!onToggleCheck}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCheck?.(block);
                  }}
                  aria-label={block.text}
                />
                <span
                  className={
                    block.checked ? "blocks-view__text--done" : undefined
                  }
                >
                  <RichText text={block.text} />
                </span>
              </p>
            );
          case "quote":
            return (
              <blockquote key={block.id} className="blocks-view__quote">
                <RichText text={block.text} />
              </blockquote>
            );
          case "divider":
            return <hr key={block.id} className="blocks-view__hr" />;
          default:
            return (
              <p key={block.id} className="blocks-view__p">
                <RichText text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
