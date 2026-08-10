/**
 * Generate docs/week-one-emails.txt from docs/WEEK_ONE_OUTREACH.md.
 *
 *   node scripts/build-week-one-emails.mjs
 *
 * WEEK_ONE_OUTREACH.md is canonical. This produces a paste-ready copy with the
 * markdown stripped, because the drafts there live inside blockquotes and
 * analysis you do not want to paste into an email client.
 *
 * The reason this is generated rather than hand-maintained: a second copy of
 * the email text is a drift hazard, and this repo has been bitten by that
 * repeatedly — the velocity line in STATUS.md was wrong for eight weeks, the
 * D26/D27 accuracy figures were quoted with no eval behind them, and
 * `political_lean` survived in prose after the column was dropped.
 * `__tests__/weekOneEmails.test.ts` fails if the two ever diverge.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "docs/WEEK_ONE_OUTREACH.md");
const OUT = join(ROOT, "docs/week-one-emails.txt");

/** Subject line + blockquoted body of one `## <header>` section, markdown stripped. */
export function extractEmail(src, header) {
  const start = src.indexOf(`## ${header}`);
  if (start === -1) throw new Error(`section not found: ${header}`);
  const rest = src.slice(start + 3);
  const nextIdx = rest.indexOf("\n## ");
  const block = nextIdx === -1 ? rest : rest.slice(0, nextIdx);

  const subject = block.match(/\*\*Subject:\*\*\s*(.+)/)?.[1]?.trim();
  if (!subject) throw new Error(`no subject in: ${header}`);

  const body = [];
  let started = false;
  for (const line of block.split("\n")) {
    if (line.startsWith(">")) {
      started = true;
      body.push(line.replace(/^>\s?/, ""));
    } else if (started) {
      if (line.trim() === "") { body.push(""); continue; }
      break;
    }
  }
  while (body.length && body.at(-1).trim() === "") body.pop();

  // Bold/italic markers would paste into the email client as literal asterisks.
  const text = body
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
  return { subject, body: text };
}

export function render(src, generatedOn) {
  const lib = extractEmail(src, "Librarian version");
  const staff = extractEmail(src, "Policy-staffer version");
  return `WEEK-ONE OUTREACH — PASTE-READY EMAILS
======================================

GENERATED FILE — do not edit by hand.
  source:     docs/WEEK_ONE_OUTREACH.md  (canonical; edit the wording THERE)
  regenerate: node scripts/build-week-one-emails.mjs
  guard:      __tests__/weekOneEmails.test.ts fails if the two drift

Generated ${generatedOn}.

Artifact:  https://siftnews.io/agencies
           Verified 2026-08-05: HTTP 200, 25 cited agencies, 96 links to
           law.cornell.edu, no auth wall, no AI-generated text.


BEFORE YOU SEND — fill these in
-------------------------------
Librarian email:
  [name]
  [research guide on government information]  <- their actual guide
  [the specific resource they link]           <- something they actually link

Staffer email:
  [name]
  [specific bill / issue area / committee]

The doc's rule: if you can't find something specific to reference, SKIP that
recipient. A generic opener converts a warm contact into a burned one.


SEND PLAN
---------
  NOW        5 librarians (pilot) — learn the reply shape before spending the list
  THIS WEEK  the rest of the librarians, once the pilot returns
  SEP 14+    all 20 staffers

Staffers wait because Congress is in recess through August and October ahead of
the midterms. WEEK_ONE_OUTREACH.md: "hold. Twenty unpiloted emails into the
pre-recess crush is the worst available combination, and staffer contacts are
the harder list to rebuild."

Success is NOT a reply count. It is enough named humans to book five calls.
~6 replies from 60 is the expected outcome, and is a success if five will talk.


================================================================================
EMAIL 1 — LIBRARIANS  (send 5 now)
================================================================================

Subject: ${lib.subject}

${lib.body}


================================================================================
EMAIL 2 — POLICY STAFFERS  (hold until Sep 14)
================================================================================

Subject: ${staff.subject}

${staff.body}


================================================================================
CLAIMS, AND WHERE EACH IS VERIFIED   (checked 2026-08-05)
================================================================================
Both emails go to people who read statutes for a living. Every claim was
checked against the cited statute itself, not just against Sift's own page.

  25 federal agencies ............ prod: 25 agencies with cited governance
  "thirteen of the twenty-five" .. prod: 13 carry a partisan-balance cap
  FEC three of six ............... 52 U.S.C. 30106 — "...may be affiliated with
                                   the same political party"; six members,
                                   single 6-year term
  NCUA two of three .............. 12 U.S.C. 1752a — "not more than two members
                                   of the board shall be members of the same
                                   political party"
  NLRB no cap at all ............. 29 U.S.C. 153 — zero party-cap mentions
  "the other 68 agencies" ........ prod: 93 agency rows, 25 cited, 68 left

  If a staffer pushes back on the FEC line: 30106 caps the APPOINTED members at
  three per party, and the Commission also seats the Secretary of the Senate and
  the Clerk of the House as NON-VOTING ex officio members. "Three of six" is
  correct for the voting membership, and the page says "appointed members".


================================================================================
THE P.S. (librarian email only)
================================================================================
Cheapest thing to cut. After the 5-send pilot:
  - all five answered the numbered questions and skipped the P.S. -> DROP it
  - even one named a tool -> KEEP it, and write the name down verbatim


================================================================================
DECIDE BEFORE A REPLY ARRIVES
================================================================================
"What happens if ten librarians say yes?" WEEK_ONE_OUTREACH.md says write the
answer down now, because the two available answers are different companies.
Read its closing section before you send, not after.
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const src = readFileSync(SRC, "utf8");
  const out = render(src, new Date().toISOString().slice(0, 10));
  writeFileSync(OUT, out, "utf8");
  console.log(`wrote ${OUT} (${out.split("\n").length} lines)`);
}
