// Sift's diamond mark for the homepage reskin. Stroke is the vermillion accent
// (themed via the --accent token), sized by the `.sl-diamond` CSS rule so the
// header/footer get 22px and the card bar gets 13px. `filled` adds the faint
// inner diamond used in the header brand.

interface SlDiamondProps {
  className?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export default function SlDiamond({
  className = "sl-diamond",
  strokeWidth = 2,
  filled = false,
}: SlDiamondProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ color: "var(--accent)" }}
    >
      <path
        d="M12 2 22 12 12 22 2 12Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {filled && <path d="M12 7 17 12 12 17 7 12Z" fill="currentColor" opacity={0.16} />}
    </svg>
  );
}
