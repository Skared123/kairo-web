import { ImageResponse } from "next/og";
import { KairoMark } from "./kairo-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The icon Safari uses for "Add to Dock" and the iOS home screen. */
export default function AppleIcon() {
  return new ImageResponse(<KairoMark size={size.width} />, size);
}
