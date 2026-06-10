"use client";
import { Fragment } from "react";
import type { NoteBlock } from "@/types/blocks";
import "./BlockContent.scss";

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

/** Renderiza texto plano convirtiendo URLs en links clicables. */
export function Linkified({ text }: { text: string }) {
  // split con grupo de captura: las URLs quedan en los índices impares
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="blocks-view__link"
            onClick={(e) => e.stopPropagation()}
          >
            {part.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Texto con **negritas** y links clicables (cualquier tipo de bloque). */
export function RichText({ text }: { text: string }) {
  // split con grupo de captura: las negritas quedan en los índices impares
  const parts = text.split(BOLD_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>
            <Linkified text={part} />
          </strong>
        ) : (
          <Linkified key={i} text={part} />
        ),
      )}
    </>
  );
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
