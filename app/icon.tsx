import { ImageResponse } from "next/og";
import { KairoMark } from "./kairo-mark";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Favicon and the manifest's install icon. */
export default function Icon() {
  return new ImageResponse(<KairoMark size={size.width} />, size);
}
