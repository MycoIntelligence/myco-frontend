import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Myco | Agentic Intelligence for Engineering";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background:
            "linear-gradient(180deg, #101614 0%, #17231f 35%, #2a3a34 65%, #efeeea 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#0e946e",
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#ffffff",
              fontSize: 38,
              fontWeight: 600,
              fontStyle: "italic",
              fontFamily: "serif",
            }}
          >
            Myco
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              color: "#ffffff",
              fontSize: 68,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              fontFamily: "sans-serif",
              lineHeight: 1.1,
            }}
          >
            Context first, then reasoning.
          </span>
          <span
            style={{
              color: "#0e946e",
              fontSize: 30,
              fontWeight: 500,
              fontFamily: "sans-serif",
              maxWidth: 800,
            }}
          >
            AI writes the code. Myco understands it.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
