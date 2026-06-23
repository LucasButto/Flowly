// Coordenadas (relativas al viewport) del caret de un <textarea> en un índice
// dado. Los <textarea> no exponen la geometría de su selección vía la Selection
// API, así que se replica el texto en un div "espejo" con los mismos estilos y
// se mide la posición. Basado en la técnica de textarea-caret-position.

const MIRROR_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export interface CaretRect {
  top: number;
  left: number;
  height: number;
}

export function caretViewportRect(
  ta: HTMLTextAreaElement,
  index: number,
): CaretRect {
  const computed = window.getComputedStyle(ta);
  const div = document.createElement("div");
  const style = div.style as unknown as Record<string, string>;
  const comp = computed as unknown as Record<string, string>;

  style.position = "absolute";
  style.visibility = "hidden";
  style.whiteSpace = "pre-wrap";
  style.wordWrap = "break-word";
  style.top = "0";
  style.left = "-9999px";
  for (const prop of MIRROR_PROPS) style[prop] = comp[prop];

  div.textContent = ta.value.slice(0, index);
  const span = document.createElement("span");
  // Contenido restante (o un punto) para anclar la medición del caret
  span.textContent = ta.value.slice(index) || ".";
  div.appendChild(span);
  document.body.appendChild(div);

  const top = span.offsetTop + parseInt(computed.borderTopWidth || "0", 10);
  const left = span.offsetLeft + parseInt(computed.borderLeftWidth || "0", 10);
  const height =
    parseFloat(computed.lineHeight) ||
    parseFloat(computed.fontSize) * 1.2 ||
    16;

  document.body.removeChild(div);

  const rect = ta.getBoundingClientRect();
  return {
    top: rect.top + top - ta.scrollTop,
    left: rect.left + left - ta.scrollLeft,
    height,
  };
}
