import type { ReactElement } from "react";

const ACCENT = "#9333ea"; // matches --color-app-accent in app/globals.css

/**
 * Shared visual for every icon surface (favicon, apple-touch-icon, manifest
 * icons). iOS ignores the manifest's icon list and renders any transparent
 * region of the apple-touch-icon as black, so this is always opaque —
 * never pass a transparent background here.
 */
export function AppIconMark({
  size,
  radius = 0,
}: {
  size: number;
  radius?: number;
}): ReactElement {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: ACCENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: size * 0.5,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: -1,
        }}
      >
        MN
      </span>
    </div>
  );
}
