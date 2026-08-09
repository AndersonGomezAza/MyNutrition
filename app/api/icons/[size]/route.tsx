import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/pwa/appIcon";

type Props = { params: Promise<{ size: string }> };

// Manifest icons for Android/desktop install prompts — iOS ignores these
// and uses apple-icon.tsx's output instead (see app/apple-icon.tsx).
export async function GET(request: Request, { params }: Props) {
  const { size: sizeParam } = await params;
  const size = Number(sizeParam) || 512;
  const maskable = new URL(request.url).searchParams.get("maskable") === "1";
  // Maskable icons need padding so Android's adaptive-icon mask doesn't
  // crop the mark — shrink the visible glyph inside the same canvas size.
  const markSize = maskable ? Math.round(size * 0.7) : size;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#9333ea",
        }}
      >
        <AppIconMark size={markSize} />
      </div>
    ),
    { width: size, height: size }
  );
}
