/** Subtle checkerboard corner accent (Reference A motif). */
export function CheckerCorner({
  className = "",
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  const s = size / 4;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="transparent"/>
      <rect x="0" y="0" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s * 2}" y="0" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s}" y="${s}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s * 3}" y="${s}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="0" y="${s * 2}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s * 2}" y="${s * 2}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s}" y="${s * 3}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
      <rect x="${s * 3}" y="${s * 3}" width="${s}" height="${s}" fill="#eab308" opacity="0.35"/>
    </svg>`
  );
  return (
    <div
      aria-hidden
      className={`pointer-events-none opacity-60 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
