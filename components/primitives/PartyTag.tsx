/**
 * Party tag (R / D / I) in NEUTRAL ink — never red/blue (§3). Differentiated
 * by letter, not color. Same treatment for every party, symmetrically.
 */
const PARTY_LABEL: Record<string, string> = {
  R: "Republican",
  D: "Democrat",
  I: "Independent",
};

interface PartyTagProps {
  party: string | null | undefined;
  className?: string;
}

export default function PartyTag({ party, className = "" }: PartyTagProps) {
  if (!party) return null;
  const code = party.trim().charAt(0).toUpperCase();
  const full = PARTY_LABEL[code] ?? party;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[3px] border border-[var(--border)] bg-[var(--surface-sunken)] font-mono text-[10px] font-medium text-[var(--text-secondary)] ${className}`}
      title={full}
      aria-label={full}
    >
      {code}
    </span>
  );
}
