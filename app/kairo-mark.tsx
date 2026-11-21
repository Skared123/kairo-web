/** The Kairo mark for generated icons: a "K" on a dark rounded square. Sized by the icon that renders it. */
export function KairoMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "#fafafa",
        borderRadius: size * 0.22,
        fontSize: size * 0.62,
        fontWeight: 700,
      }}
    >
      K
    </div>
  );
}
