import "./Brand.scss";

interface BrandProps {
  size?: number;
  showWordmark?: boolean;
}

/** Logo de Flowly: marca con onda (gradiente por CSS) + wordmark. */
export default function Brand({ size = 34, showWordmark = true }: BrandProps) {
  return (
    <span className="fl-brand">
      <span
        className="fl-brand__mark"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 48 48" fill="none">
          <path
            d="M10 30c4-7 8-7 12 0s8 7 12 0"
            stroke="#fff"
            strokeWidth="3.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 20c4-7 8-7 12 0s8 7 12 0"
            stroke="#fff"
            strokeWidth="3.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </svg>
      </span>
      {showWordmark && <span className="fl-brand__word">Flowly</span>}
    </span>
  );
}
