interface SiftLogoProps {
  variant?: "full" | "compact" | "mark" | "wordmark";
  size?: number;
  className?: string;
}

/**
 * Brand mark: ◆ diamond rendered as SVG so it scales perfectly
 * and inherits theme colors via var(--accent).
 */
function DiamondMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--accent)"
      aria-hidden="true"
    >
      <path d="M12 2L22 12L12 22L2 12Z" />
    </svg>
  );
}

export default function SiftLogo({
  variant = "full",
  size = 28,
  className = "",
}: SiftLogoProps) {
  const markSize = Math.round(size * 0.5);

  if (variant === "mark") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <DiamondMark size={markSize} />
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`font-heading font-extrabold tracking-tight leading-none ${className}`}
        style={{ fontSize: size, color: "var(--text-primary)" }}
      >
        Sift
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <DiamondMark size={markSize} />
        <span
          className="font-heading font-extrabold tracking-tight leading-none"
          style={{ fontSize: size, color: "var(--text-primary)" }}
        >
          S
        </span>
      </span>
    );
  }

  // variant === "full"
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <DiamondMark size={markSize} />
      <span
        className="font-heading font-extrabold tracking-tight leading-none"
        style={{ fontSize: size, color: "var(--text-primary)" }}
      >
        Sift
      </span>
    </span>
  );
}
