import { COPY, CORRECTIONS_EMAIL } from "@/lib/copy";

/**
 * A way to tell us we got something wrong.
 *
 * `standards-counsel` (LAUNCH_DECISION_MEMO.md §5, B4) ranks this above almost
 * everything else on the list: documented notice-and-correction is the single
 * strongest mitigation available to a one-person publisher, and *Starbuck v.
 * Google* (MTD denied 24 Jul 2026) held that AI disclaimers alone do not defeat
 * a defamation claim at the pleading stage. The process is what does.
 *
 * Until today there was no `mailto:` anywhere in `app/`, `components/` or
 * `lib/` — the only correction route was "open a GitHub issue", on a page whose
 * audience is librarians and policy staff.
 *
 * RENDERS NOTHING WHEN `CORRECTIONS_EMAIL` IS EMPTY. That is deliberate and is
 * the whole safety property: publishing an address that does not receive mail
 * is worse than publishing none — it presents a correction path that silently
 * fails, which is the exact class of defect this page spent the day removing.
 * Set the constant only once the mailbox actually exists.
 */
export default function CorrectionPath() {
  if (!CORRECTIONS_EMAIL) return null;
  const c = COPY.corrections;

  return (
    <section className="mb-10">
      <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
        {c.heading}
      </p>
      <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[62ch]">
        {c.body}{" "}
        <a
          href={`mailto:${CORRECTIONS_EMAIL}?subject=${encodeURIComponent(c.subject)}`}
          className="text-(--accent) no-underline hover:underline"
        >
          {CORRECTIONS_EMAIL}
        </a>
        .
      </p>
      <p className="font-body text-meta text-(--text-tertiary) mt-3 max-w-[62ch] leading-relaxed">
        {c.window}
      </p>
    </section>
  );
}
