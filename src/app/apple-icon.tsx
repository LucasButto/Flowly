import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const WAVE =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>" +
  "<path d='M10 30c4-7 8-7 12 0s8 7 12 0' stroke='white' stroke-width='3.6' stroke-linecap='round' fill='none'/>" +
  "<path d='M10 20c4-7 8-7 12 0s8 7 12 0' stroke='white' stroke-width='3.6' stroke-linecap='round' fill='none' opacity='0.55'/>" +
  "</svg>";

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(WAVE).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={112} height={112} alt="" />
      </div>
    ),
    { ...size },
  );
}
