import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/pwa/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed square, no radius — iOS applies its own corner rounding to
// whatever square you give it; adding a radius here just leaves a visible
// mismatched corner behind the OS's mask.
export default function AppleIcon() {
  return new ImageResponse(<AppIconMark size={180} radius={0} />, size);
}
