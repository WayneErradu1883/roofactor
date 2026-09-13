// The green-gradient rounded logo tile with a white house-outline icon.
export function BrandLogo({
  className = "size-8 rounded-[9px]",
  iconSize = 17,
}: {
  className?: string;
  iconSize?: number;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-gradient-to-br from-[#0a7b29] to-[#14963a] shadow-[0_4px_10px_rgba(10,123,41,0.3)] ${className}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
      </svg>
    </span>
  );
}
