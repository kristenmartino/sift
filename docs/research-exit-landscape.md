I have all research in hand. Writing the report.

---

# Selling an AI News Aggregator: Market Research Report
**Compiled 27 July 2026.** Every claim carries a source URL. Where data does not exist publicly, it is marked **NOT FOUND** rather than estimated.

**Method note / limitation:** this session exhausted its 200-call WebSearch budget; the later research ran on direct WebFetch. A handful of sources (Duuce, NameBio, Sedo, Reuters/AP licensing pages, Search Engine Land) were unreachable due to robots.txt, 403s, or redirect loops and are flagged individually.

---

## THE ONE-PARAGRAPH ANSWER

A zero-revenue product does not clear the listing floor at any venue that produces real prices. Empire Flippers requires **$1,500/mo net profit + 12 months history** and rejects **91%** of submissions; Acquire.com's median outcome is **3.9x profit** and its advisory tier requires **$100k+ TTM revenue**; Flippa's entire valuation framework is *monthly net profit × multiple*, which is zero when profit is zero; Tiny wants **$3M–$50M annual profit**. Every observed exit for a zero-revenue news product falls into one of three buckets — an **undisclosed tech-only asset sale to a strategic** (Artifact→Yahoo, Brigade→Countable), an **acquihire where the team is the asset**, or **no sale at all** (The Messenger burned $50M and found no buyer). On top of that, this specific product sits in the one fact pattern where AI copyright law is trending *adverse*: RAG-based news summarization, where two S.D.N.Y. judges have now held AI summaries can plausibly infringe, and where every favorable ruling to date is a *training* ruling that does not transfer.

---

## 1. WHERE SMALL INTERNET BUSINESSES ACTUALLY SELL IN 2026

| Venue | Typical size | Fee structure | Pre-revenue viable? | What actually transacts |
|---|---|---|---|---|
| **Acquire.com** (formerly MicroAcquire — same company, renamed) | EV under $10M; median outcome 3.9x profit | **$25/mo listing under $250k + 8% closing**; $50/mo $250k–$1M + 7%; $100/mo $1M+ + 6%. Escrow included free. ([acquire.com/seller-pricing](https://acquire.com/seller-pricing/)) | **Technically yes** — no stated revenue minimum on standard tiers. **Practically no** — the "Guided by Acquire" advisory tier is "**for profitable SaaS startups with $100k+ revenue only**," and in April 2025 the platform repositioned itself as serving "every **profitable** online business" ([blog.acquire.com](https://blog.acquire.com/were-no-longer-just-for-saas-acquire-com-now-supports-every-profitable-online-business/)) | Profitable micro-SaaS. Avg **81 days** on market, majority close within 90. Avg net margin of sold businesses **71%**. Their own report states "**unprofitable listings may take longer to sell and attract fewer offers**" ([Jan 2026 multiples report](https://blog.acquire.com/acquire-com-biannual-acquisition-multiples-report-jan-2026/)) |
| **Flippa** | $1k to $50M+; manual vetting kicks in at **$50,000+** | **Flat listing fees, no percentage success fee published**: under $10k → $29/$49/$199; $10k–$50M → $49/$399/$599 (6mo). NDA add-on $199. FlippaPay from 1%, Escrow.com from 1.2%. Buyer Premium $49/mo. ([flippa.com/pricing](https://flippa.com/pricing)) | **Yes — this is the venue that will actually take the listing.** The $29 under-$10k tier is where zero-revenue assets go | Verified via read-only integrations: **Google Analytics, AdSense, AdMob, Shopify, Stripe, WooCommerce, QuickBooks**. Two badges: "Data Verified" and "Vetted by Flippa" ($50k+, human review incl. live screen-share) ([support.flippa.com](https://support.flippa.com/hc/en-us/articles/4842857720079-Understanding-verified-listings-on-Flippa)). Sellers who can't verify get **listings cancelled with refund** |
| **MicroAcquire** | — | — | — | **Does not exist as a separate entity.** Rebranded to Acquire.com. Any "MicroAcquire" advice is pre-2022 |
| **Empire Flippers** | $66k–$5M+; **2,653 deals sold**, $590M+ facilitated, **124 days** avg time to sale | **Flat $10,000 up to $66,666.66** (i.e. ≥15% and punitive on small deals), then **15%** to $700k, **8%** to $5M, **2.5%** above. 2-month exclusivity ([empireflippers.com/sell](https://empireflippers.com/sell/)) | **Hard no.** "$1,500 per month or more in net profit over a 12-month average" + "**at least 12 months of revenue/earnings**" + **minimum 3 months of Google Analytics/Clicky data** | **91% of submissions are rejected**; 64% fail at the five-minute check. Rejection causes: **31% ID verification, 25% insufficient earnings/history**. Content-site specific: inconsistent traffic, sketchy backlinks, missing analytics, post-algorithm decline. Owner involvement **>40 hrs/wk is disqualifying**. ([rejection-rate page](https://empireflippers.com/rejection-rate-vetting-process/)) |
| **Tiny** (Andrew Wilkinson) | **$3M–$50M+ in annual profit** | N/A (direct buyer) | **No.** "Profitable today. Real revenue, real margins. **Not a pitch deck with projections**" | "All-cash deals, minimal earn-outs, no forced equity rollover, no retrade clauses." Offer weeks 1–2, diligence 2–4 weeks ([tiny.com/founders](https://tiny.com/founders)) |
| **Duuce** | **NOT FOUND** — robots.txt blocked the fetch. Could not verify listing sizes, fees, or activity status | | | |
| **IndieMaker** | **$1,000–$500,000**; examples at $4k (games), $7.9k (mobile apps), $50k (SaaS) | **Free, no commission** | **Yes** — "curated, free marketplace for bootstrapped founders to buy and sell side-hustles, micro-SaaS, and digital startups." Site active (© 2026, listings through early 2026) ([indiemaker.com](https://indiemaker.com/)) | Small hand-sold assets. Note: `indiemaker.co` 302-redirects to `indiemaker.com` |
| **SideProjectors** | Small; specific prices not published | Free basic listing; premium features for visibility | **Yes, explicitly.** Featured listings include **"pre-launch" status with 0 monthly visitors** (DocuMind AI, ShieldAI Scanner, Planify) ([sideprojectors.com](https://sideprojectors.com/)) | Side projects, including unlaunched ones. Their own guidance: "2–3x annual revenue for established projects, **or based on development hours** for newer projects" — i.e. cost-to-build pricing |
| **BizBuySell** | Main Street, mostly offline. **Q2 2026: 2,117 businesses sold, $1.8B total EV, median sale price $349,250** (−1% YoY) | Listing-fee model | Not a fit — the marketplace is built around cash-flowing brick-and-mortar | **Avg 2.7x cash flow, 0.7x revenue.** Median cash flow $155,921, median revenue $692,087. **No internet/online category breakout** in the report ([bizbuysell.com/insight-report](https://www.bizbuysell.com/insight-report/)) |

**The structural finding:** the venues that will *accept* a pre-revenue listing (Flippa's $29 tier, SideProjectors, IndieMaker) are precisely the ones that publish **no transaction data**, run **no verification**, and produce **no price discovery**. The venues that produce real prices all have profit floors this asset does not clear. That is not a coincidence — it is the same fact viewed from two sides.

---

## 2. VALUATION MULTIPLES (2025–2026)

### 2.1 The published multiples

| Source | Metric | Multiple | Date / scope |
|---|---|---|---|
| **Acquire.com Biannual Multiples Report** | Net profit | **Median 3.9x** (2024 and 2025); average "low-to-mid 4x range". Sub-$100k-profit businesses average **3.7x** | Jan 2026; anonymized marketplace data, **EV below $10M**, profitable SaaS only. Explicitly: "the focus is entirely on **profit multiples**" — they publish no revenue or ARR multiple. ([link](https://blog.acquire.com/acquire-com-biannual-acquisition-multiples-report-jan-2026/)) |
| **Same** | Public SaaS comparison | Declined **17x (2022) → ~5.5x (end 2025)** | The entire asset class re-rated down ~68% in three years |
| **Empire Flippers** | **Monthly** net profit (6–12 mo average) | **20x–60x+** = **1.7x–5.0x annualized** | [empireflippers.com/sell](https://empireflippers.com/sell/) |
| **Flippa** | **Monthly** net profit | **30x–45x** = **2.5x–3.75x annualized**. Formula stated as "Average monthly net profit × valuation multiple = website value," requiring "profit proof from the last 12–24 months" | [flippa.com/blog](https://flippa.com/blog/how-to-sell-a-website-with-no-traffic-or-revenue/) |
| **BizBuySell Q2 2026** | Cash flow / revenue | **2.7x cash flow; 0.7x revenue** | Main Street, 2,117 transactions ([link](https://www.bizbuysell.com/insight-report/)) |
| **FE International** | SDE (small SaaS band) | **2.5x–4x SDE** | [feinternational.com](https://www.feinternational.com/blog/saas-due-diligence-checklist-buyers) |
| **CT Acquisitions** (sub-$1M band) | SDE | **<$250k earnings → 1.5–3x**; $250–500k → 2.5–3.5x; $500–750k → 3–4.5x | [ctacquisitions.com](https://ctacquisitions.com/selling-a-business-under-1-million/) |

### 2.2 The MRR threshold that makes a listing viable at all

The floors are published and they are the operative numbers:

- **Empire Flippers: $1,500/mo net profit, 12 months of it** — ~$18k/yr profit
- **Acquire.com Guided tier: $100k+ TTM revenue**
- **Flippa manual vetting: $50,000+ asking price** (below that, no human ever looks)
- **Tiny: $3M+ annual profit**

Below ~$1,500 MRR net profit there is no venue with buyer liquidity. Between $1,500 MRR and $100k ARR you are in Flippa/Acquire self-serve territory at **1.7x–4x annualized profit**.

### 2.3 What a pre-revenue product with users but no revenue actually fetches

**This is the sharpest gap in the entire research, and it is a real gap, not a research failure.**

- Flippa's own guide on selling a site with no traffic or revenue **contains no valuation method for zero-revenue assets** — the formula requires profit as an input, so the asset falls outside the framework entirely. No dollar figures, no multiples, no approach.
- **NOT FOUND: any marketplace-published data on what zero-revenue web apps actually clear on Acquire.com or Flippa.** None of them publish it. Treat any blog claiming "$2k–$5k for zero-revenue sites" as unverified anecdote — I could not source it.
- The only formal ceiling anyone in this ecosystem cites for pre-revenue is the **Berkus method's $2.5M maximum pre-money** (five elements × $500k each: sound idea, prototype, quality management team, strategic relationships, product rollout) — but Acquire.com presents this as a **VC pre-money framework, not an exit price**, and it assumes a *team* and *strategic relationships* that a solo builder does not have ([blog.acquire.com/how-to-value-a-startup](https://blog.acquire.com/how-to-value-a-startup)).
- SideProjectors' own guidance for early projects is **cost-to-build**: "based on development hours and market value for newer projects." That is the realistic anchor at this end of the market — not a multiple, a replacement-cost number.

### 2.4 AI-wrapper multiples specifically

**NOT FOUND: any published multiple for AI-wrapper products as an asset class.** No marketplace has broken this out. What exists is adjacent and should not be confused with it:

- **beehiiv: $192M valuation (May 2024 Wefunder mark) on $30M ARR by June 2025** — but at its $33M Series B (Apr 2024, NEA/Lightspeed/Sapphire) ARR was ~$13M, implying **~14.8x ARR** ([Sacra](https://sacra.com/c/beehiiv/)). This is a *venture mark on an infrastructure platform*, not an acquisition of a wrapper.
- **Semafor: $330M valuation on $30M round, Jan 7 2026**, against **$40M 2025 revenue and $2M EBITDA** = **~8.25x revenue** ([Reuters via Yahoo Finance](https://finance.yahoo.com/news/semafor-hits-330-million-valuation-144610180.html)).
- **1440: $101M valuation on ~$27M revenue = ~3.7x**, bootstrapped, 27 employees, ~$1M revenue/employee ([Pulse2](https://pulse2.com/1440-reaches-101-million-valuation-as-newsletter-business-expands-beyond-the-inbox/)).

What buyers *do* now explicitly diligence on AI products, per FE International's 2026 checklist: "**model inputs and training data rights**, output evaluation procedures, model drift monitoring, **risk of third-party model reliance versus proprietary capabilities**." Building on someone else's LLM is scored as a *risk factor*, not a value driver. Their gross-margin bar — **>75% target, <65% warrants investigation** — is where per-query Claude API COGS gets scrutinized.

---

## 3. WHAT BUYERS ACTUALLY DILIGENCE

### 3.1 Verification mechanics (the part that is concrete and checkable)

**Flippa** connects **read-only** third-party integrations — GA, AdSense, AdMob, Shopify, Stripe, WooCommerce, QuickBooks — and states "the data is read-only and cannot be edited by either the seller or Flippa." At $50k+, the vetting team verifies revenue via **direct platform access or a live remote screen-share session**, expenses via invoices, traffic via GA/Shopify/Seller Central.

**Empire Flippers** demands revenue/expense data for **up to three years or the life of the business, whichever is longer**, plus **API access or second-user credentials** so EF can pull reports itself. **EF builds the P&L; it does not accept the seller's.** Both parties undergo ID verification.

**FE International** requires a "full ARR/MRR bridge by month, **reconciled against bank statements**," three years of management accounts plus YTD, and deferred revenue analysis.

### 3.2 The consolidated checklist, with actual thresholds

From **FE International's 2026 SaaS buyer checklist** ([link](https://www.feinternational.com/blog/saas-due-diligence-checklist-buyers)):

- **Concentration:** flag any single customer **>15–20% of ARR**
- **Churn:** 6–10% annual (mid/large SaaS); **3–7% monthly** for SMB tools
- **Gross margin:** target **>75%**; **<65% investigate**
- **NRR:** 120% NRR commands **30–50% higher multiples** than 100%
- **CAC payback <12 months; LTV:CAC ≥3:1; Rule of 40 ≥40**
- Cohort retention by customer vintage; gross and logo churn by cohort
- Named warning signs: rising QoQ churn, declining expansion revenue, **change-of-control clauses letting customers cancel post-acquisition**, and "**support dependency on founder's personal knowledge**"
- **Owner-dependency premium:** businesses with **outsourced teams command a 0.5x–0.75x multiple premium** over founder-run ones
- Legal: IP assignment verified as "owned by the entity, **not individuals**"; contractor agreements; SOC 2 Type II for enterprise; GDPR/CCPA; DPAs; cyber insurance
- Timeline: weeks 1–2 data room + financials; 2–3 technical/legal/customer; 4–6 issue resolution and close

From **Website Closers** (updated 17 July 2025, [link](https://www.websiteclosers.com/resources/due-diligence-checklist-for-selling-a-business/)) — the best public source on **transferability**, which is the section that matters most here:

- Domain ownership and transfer procedures
- **SaaS account transferability *terms*** — the contractual right, not just the credentials
- **API integrations and their transferability restrictions**
- Cloud/hosting accounts, email, social, customer database transfer protocol
- IP: work-for-hire agreements, consultant agreements, **invention-assignment agreements**
- **Software licence agreements reviewed specifically for transferability restrictions**
- Named deal-killers: unresolved litigation, IP infringement claims or ownership disputes, **non-transferable licences**, undisclosed key-employee dependency, unclear ownership of critical assets

**Acquire.com's own checklist** ([link](https://blog.acquire.com/due-diligence-checklist-for-buying-a-business/)) covers eight categories; its IT section explicitly lists "review software licence transferability terms" and flags "**non-transferable software licences**" and "poor data governance" as red flags; financial red flags include "customer/supplier concentration exceeding 20% of revenue."

**Quiet Light** publishes the thinnest guidance of the group — technical (incl. **code quality**), legal, operational, financial categories, but **no published red-flag or deal-killer list** ([link](https://quietlight.com/your-guide-to-due-diligence-when-buying-a-small-business/)).

### 3.3 Transferability of the actual accounts — I read the ToS

This is where most solo sellers are wrong, and the contract language is unambiguous:

**Anthropic Commercial Terms §M.4** ([anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)):
> "Neither party may assign its rights or delegate its obligations under these Terms without the other party's prior written consent... Any purported assignment or delegation is **null and void** except as permitted above."

The "sale of all or substantially all its business" carve-out is written **for Anthropic, not for the customer**. Read literally, the customer cannot assign its Anthropic agreement in an acquisition without Anthropic's prior written consent.

**OpenAI Services Agreement §16.7** is *more* transfer-friendly: "Either Party may assign this Agreement to a successor to substantially all the respective party's assets or business, provided the assigning party provides at least **thirty days prior written notice**" ([link](https://openai.com/policies/services-agreement/)).

**Vercel ToS**: "You may not assign, transfer or sublicense without the prior written consent of Vercel, but Vercel may assign or transfer this Agreement, in whole or in part, without restriction" ([vercel.com/legal/terms](https://vercel.com/legal/terms)). No account-transfer mechanism exists; full transfer requires contacting support.

**Consequence:** for an app of this shape the transferable assets are the **domain, the code repo, the database/content, the brand, and any list**. The LLM API relationship, the hosting account, and the analytics property get re-created by the buyer — so "our Claude integration" is not a transferring asset and will not be valued as one.

### 3.4 What kills deals — the published data

**Axial 2025 Dead Deal Report**, 75 broken LOIs ([axial.net](https://www.axial.net/forum/dead-deal-report-unpacking-2025s-broken-lois/)):

| Cause | 2025 share | Trend |
|---|---|---|
| **Non-QoE diligence findings** (undisclosed legal/compliance risk, concentration, contract issues) | **25.3%** | 19.1% → 21.5% → 25.3% — **rising** |
| QoE / EBITDA discrepancies | 21.3% | 10.6% (2023) → 21.3% — doubled |
| Renegotiation failure | 14.7% | — |
| Seller withdrew | 13.3% | — |
| Financing constraints | 10.7% | falling from 21.3% |
| Business underperformed during diligence | 8.0% | — |

Average exclusivity before termination: **29–159 days** depending on buyer type.

**Acquire.com's 2025 retrospective** names **overpricing** as the most common deal-killer: "Buyers anchor on market comparables, and pricing above expectations caused early disengagement before substantive discussions began"; "inflated SDE without genuine net profit consistently deterred serious buyers" ([link](https://blog.acquire.com/inside-2025s-winning-exits-on-acquire-what-founders-can-learn-going-into-2026-webinar-recap/)).

### 3.5 Deal structures in the sub-$1M band

- **Empire Flippers**: **$50K–$150K typically all-cash; $150K–$750K is where structuring begins; $750K+ brings complex structures.** "If your business is valued under $350,000, there's a good chance you'll receive an all-cash offer." ([May 12, 2021](https://empireflippers.com/deal-negotiations-fba/)) **The implication matters: at the low end buyers do not structure around risk — they discount the price or walk.**
- **CT Acquisitions** sub-$1M stack: SBA 7(a) 70–80%, buyer equity 10–15%, **seller financing 15–30%**, **earnouts 10–25% of price where used**, duration **6–24 months** keyed to revenue or gross margin (not EBITDA), collection rate **70–90%**. Serious-buyer pool: **2–4 advanced buyers**. Timeline 6–9 months. SBA denial kills **10–20%** of deals.
- **Escrow.com fees**: 2.6% under $5k ($50 min); 2.4% $5k–50k ($130 min); 1.9% $50k–200k ([escrow.com/fee-calculator](https://www.escrow.com/fee-calculator)).
- **NOT FOUND: any published standard reps & warranties package, escrow percentage, holdback, or survival period benchmark for sub-$1M internet deals.** No broker publishes model language. The **ABA 2025 Private Target Deal Points Study** (139 agreements) has a **floor of $25M** purchase price; **SRS Acquiom's 2026 study** is gated. The only survival datum at this size is Acquire.com's **illustrative six months** post-closing ([APA guide](https://blog.acquire.com/what-do-the-legal-terms-mean-in-an-asset-purchase-agreement-apa/)).
- **RWI (reps & warranties insurance) is effectively unavailable below ~$25M.** ABA's population floor is $25M with 63% RWI penetration. Best pricing datum is stale: **April 2022 average 3.5% rate on line** ([ABA Business Law Today, June 2022](https://businesslawtoday.org/2022/06/reps-warranties-rwi-spring-2022-trends/)). **Practical consequence: the buyer's only protection is escrow against the seller personally** — nowhere near adequate against copyright statutory damages of up to $150,000/work.

---

## 4. RISK FACTORS SPECIFIC TO A NEWS AGGREGATOR

### 4.1 The controlling precedent is *against* aggregators, and it is squarely on point

**Associated Press v. Meltwater**, 931 F. Supp. 2d 537 (S.D.N.Y. **21 Mar 2013**), Judge Cote. Meltwater copied **4.5%–60% per article, including the lede**. The court **rejected fair use on all four factors**: not transformative, a market substitute rather than a discovery tool, directly harmful to AP's licensing revenue. Copying headlines + excerpts + metadata was held not fair use *precisely because the service competed with AP's licensing business* ([Copyright Office summary](https://www.copyright.gov/fair-use/summaries/ap-meltwater-sdny2013.pdf); [EFF critique](https://www.eff.org/deeplinks/2013/03/ap-v-meltwater-disappointing-ruling-news-search)).

The cases that go the other way — **Kelly v. Arriba Soft**, **Perfect 10 v. Amazon** (508 F.3d 1146, 9th Cir. 2007, adopting the **server test**), **Authors Guild v. Google** (804 F.3d 202, 2d Cir. 2015, cert. denied Apr 2016) — all won because **the copy drove traffic to the source**. Meltwater lost because the copy **replaced** it. An AI summary that satisfies the user's need without a click sits on the Meltwater side of that line. Judge Cote specifically called out the **lede** as the journalistically skilled part — and a lede is exactly what an LLM summary reconstructs.

**Hot news misappropriation** is largely dead: **NBA v. Motorola** (105 F.3d 841, 2d Cir. 1997) set the five-element test, and **Barclays v. Theflyonthewall.com** (650 F.3d 876, 2d Cir. 2011) held the tort largely **preempted by the Copyright Act**. It's a nuisance claim adding settlement pressure in NY, not a business-ending exposure.

### 4.2 The 2025 ruling that changes the analysis

**Advance Local Media / Condé Nast et al. v. Cohere**, No. 1:25-cv-01305 (S.D.N.Y.), Judge Colleen McMahon, **motion to dismiss DENIED 14 Nov 2025.** The court held that **"substitutive summaries"** — non-verbatim AI outputs mirroring the expressive structure and journalistic choices of the original — **may plausibly infringe**. Key language: *"It is not possible to determine infringement through a simple word count"*; "the quantitative analysis of two works must always occur in the shadow of their qualitative nature." Lanham Act claims over hallucinated content attributed to publisher brands also survived. Plaintiffs: Forbes, Condé Nast, LA Times, The Atlantic. ([Copyright Lately](https://copyrightlately.com/court-rules-ai-news-summaries-may-infringe-copyright/); [News/Media Alliance](https://www.newsmediaalliance.org/judge-denies-cohere-motion-to-dismiss/); [Justia docket 59](https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1:2025cv01305/636920/59/))

Reinforced by **Judge Sidney Stein, In re OpenAI Copyright Infringement Litigation, 27 Oct 2025**, denying dismissal on substantial similarity and specifically citing ChatGPT's ability to produce "**highly accurate summaries** of books authored by the plaintiffs, as well as outlines for sequels."

### 4.3 Litigation status table (as of July 2026)

Scale: **~120–128 copyright suits against AI developers** ([Quinn Emanuel, July 2026](https://www.quinnemanuel.com/the-firm/publications/emerging-ai-legal-risks-july-2026-update/); [tracker, 19 July 2026](https://chatgptiseatingtheworld.com/2024/08/27/master-list-of-lawsuits-v-ai-chatgpt-openai-microsoft-meta-midjourney-other-ai-cos/)).

| Case | Status July 2026 | Relevance |
|---|---|---|
| **NYT v. Microsoft & OpenAI** | MTD largely denied **26 Mar 2025**; consolidated into MDL; **summary judgment phase**; NYT amended complaint June 2026 dropping trademark dilution. **No fair use ruling, no trial date** | The bellwether — still no answer ([Axios](https://www.axios.com/2025/04/01/nyt-openai-microsoft-lawsuit-advances)) |
| **Thomson Reuters v. Ross** (D. Del.) | SJ for Thomson Reuters **11 Feb 2025** (Judge Bibas): training not fair use. **Third Circuit oral argument 11 June 2026; no decision** | First AI fair use ruling; went against the AI company. Biggest single legal variable in the sector ([Venable](https://www.venable.com/insights/publications/2025/02/judge-rejects-fair-use-defense-in-thompson-reuters)) |
| **Dow Jones & NYP v. Perplexity** (S.D.N.Y.) | **21 Aug 2025: MTD for jurisdiction/venue and transfer motion all DENIED.** Proceeding in SDNY | **This is the analogous case.** Two counts: (1) copying works as **inputs to the RAG index**, (2) verbatim output reproduction, plus Lanham Act false designation ([Loeb & Loeb](https://www.loeb.com/en/insights/publications/2025/08/dow-jones-and-company-inc-v-perplexity-ai-inc)) |
| **Advance/Condé Nast v. Cohere** | **MTD denied 14 Nov 2025.** Cohere did **not** challenge the RAG allegations at MTD | Directly holds AI news summaries can infringe |
| **Bartz v. Anthropic** (N.D. Cal.) | Alsup **23 June 2025**: training on lawfully acquired books is "**quintessentially transformative**" fair use; retaining pirated copies is **not**. **$1.5B settlement, final approval 21 July 2026**, ~**$3,100/work** across a **482,460-book** class. Explicitly **no binding precedent** | Establishes the split: **how you acquired the copy** is a separate, non-protected act ([Authors Alliance](https://www.authorsalliance.org/2026/07/21/bartz-v-anthropic-settlement-receives-final-approval/)) |
| **Kadrey v. Meta** | Chhabria **25 June 2025**: partial SJ for Meta on training fair use; **seeding/torrenting claims survive**. "**Market dilution**" theory left open | Same acquisition/use split |
| **Ziff Davis v. OpenAI** | **15 Dec 2025**: unjust enrichment dismissed with prejudice; **DMCA §1201 dismissed — "robots.txt files are 'mere requests' rather than technological controls."** Direct + contributory infringement and **§1202 CMI-removal** survived | Cuts both ways — see §4.6 ([Loeb & Loeb](https://www.loeb.com/en/insights/publications/2026/01/in-re-openai-inc-copyright-infringement-litigation-dec-15-2025)) |
| **Getty v. Stability AI** (UK High Court) | **Nov 2025: secondary copyright claim FAILED**; narrow trademark win for Getty | UK currently friendlier than US ([Latham](https://www.lw.com/en/insights/getty-images-v-stability-ai-english-high-court-rejects-secondary-copyright-claim)) |
| **Tribune Publishing v. Perplexity** | Filed **4 Dec 2025**. Alleges scraping for RAG **and that the Comet browser circumvents the paywall** | Paywall circumvention converts a fair-use fight into a bad-actor narrative ([TechCrunch](https://techcrunch.com/2025/12/04/chicago-tribune-sues-perplexity/)) |
| **News Corp v. Brave Software** (N.D. Cal.) | Brave DJ action **12 Mar 2025** over its data-licensing service and **RAG functionality**; dismissed; **refiled May 2026**; **News Corp copyright counterclaims 21 July 2026** | **The closest live analogue to a scrape-index-and-relicense news business** ([21 July 2026](https://chatgptiseatingtheworld.com/2026/07/22/news-corp-files-copyright-infringement-counterclaims-v-brave-software-in-revived-lawsuit/)) |
| **Like Company v. Google Ireland, C-250/25** (CJEU Grand Chamber) | **First-ever CJEU hearing on generative AI and copyright, 10 March 2026.** Judgment pending. Questions: is a chatbot response mirroring a press article a communication to the public; is tokenization reproduction; does the TDM exception apply | The EU equivalent, squarely about **output-side summarization of news** ([Bird & Bird](https://www.twobirds.com/en/insights/2026/like-company-v-google-cjeu-holds-first-ever-hearing-on-generative-ai-and-copyright-on-10-march-2026)) |

### 4.4 The RAG-vs-training distinction — the crux

**Every favorable fair-use ruling to date (Alsup, Chhabria, UK Getty) is a *training* ruling**, resting on transformation: the model learns statistical structure and doesn't output the work. **None of that reasoning transfers to a RAG aggregator.** In a retrieval-and-summarize system: (1) the ingest copy is a straight reproduction serving *the same informational purpose* as the publisher; (2) the output is derived from that specific article at query time, so *Cohere*'s substitutive-summary theory applies cleanly; (3) market substitution is at its worst — the user's need is satisfied without a click. This is exactly how Dow Jones, Tribune, and News Corp/Brave have pleaded it, and Quinn Emanuel's July 2026 landscape treats RAG/answer-engine claims as a **distinct and growing category**.

> **NOT FOUND — and this is the single most consequential fact in the report: no court has issued a *merits* ruling (SJ or trial) on whether RAG-based news summarization is fair use.** Every RAG case is at or just past the pleading stage. There is no answer, and there won't be one before a sale would need to close.

### 4.5 Licensing economics — there is no priceable remediation path

**Wire service pricing: essentially no public data.** AP, Reuters Connect, AFP, PARS International, YGS, and Copyright Clearance Center are **all quote-only with zero published rates**. PARS: "No pricing is published… Let's Talk." AP's and Reuters' licensing pages returned 403. The trade press doesn't have it either — **Gannett dropped AP effective 25 Mar 2024** and **McClatchy the same month**, and a "Gannett spokesperson **declined to comment on partnership costs**" ([Nieman Lab](https://www.niemanlab.org/2024/03/gannett-will-stop-using-ap-content-next-week/); [Poynter](https://www.poynter.org/commentary/2024/associated-press-gannett-mcclatchy-drop-content/)). **NOT FOUND: any published dollar figure for what a small digital publisher pays for a wire feed.**

**The AI licensing deals that do have numbers** (reported, not audited — sources: [LLM Pulse deal map](https://llmpulse.ai/blog/ai-content-licensing-deals/), [Quartz](https://qz.com/ai-training-data-pricing-licensing-deals-market-052126), [Press Gazette tracker](https://pressgazette.co.uk/platforms/news-publisher-ai-deals-lawsuits-openai-google/)):

| Deal | Value | Date |
|---|---|---|
| OpenAI – News Corp | **$250M / 5 yr (~$50M/yr)** | May 2024 |
| Meta – News Corp | up to **$50M/yr**, 3 yr | 2024 |
| Amazon – New York Times | **$20–25M/yr** | May 2025 |
| OpenAI – Dotdash Meredith | ~**$16M/yr** | 2024 |
| OpenAI – Axel Springer | ~$13M over 3 yr | Dec 2023 |
| OpenAI – Financial Times | **$5–10M/yr** | Apr 2024 |
| Mistral – AFP | undisclosed; **grounding only, not training** | Jan 2025 |

**Marketplace/intermediary take rates**, from Open Markets Institute, *"Same Gatekeepers, New Tollbooths"* (Radsch & Montoya, **May 2026**) ([Nieman Lab writeup](https://www.niemanlab.org/2026/05/the-emerging-ai-content-licensing-market-puts-news-publishers-in-a-double-bind-a-new-report-warns/); [Brookings](https://www.brookings.edu/articles/same-gatekeepers-new-tollbooths-in-the-ai-content-licensing-market/)): **ScalePost ~15%** of rightsholder revenue; **Cloudflare pay-per-crawl ~30%** (est.); **ProRata.ai/Gist 50/50**; **TollBit and Sphere** charge the AI company instead. **Perplexity Publishers Program** (launched 30 July 2024 — TIME, Der Spiegel, Fortune, Entrepreneur, Texas Tribune): revenue share percentage **never disclosed**; a $42.5M pool has been reported.

**NOT FOUND: per-article, per-crawl, or per-token rates.** Both OMI and Brookings say the market is deliberately opaque. Brookings additionally reports the **"deal premium" for licensed publishers had essentially evaporated by Q4 2025, with a six-fold collapse in click-through rates.**

> **The hardest fact in this section: the deals that exist run $5M–$50M/yr and were signed by counterparties with $100M+ balance sheets. A sub-$1M aggregator cannot buy its way to a clean licence at any publicly known price point — which means a buyer cannot compute "cost to make compliant," which is exactly the number that would let them bid.**

Note also: **Anthropic signed no comparable publisher licences and instead settled Bartz for $1.5B** — so the upstream model vendor has no news licensing to pass through.

### 4.6 Platform distribution policy — better than expected in one place, worse in another

**Google Search spam policies, last updated 2026-05-15** ([developers.google.com](https://developers.google.com/search/docs/essentials/spam-policies)):

- **Scaled content abuse — this is the exposure.** Enumerated violations that map directly onto this architecture: "Using generative AI tools… to generate many pages without adding value"; "**Scraping feeds, search results, or other content to generate many pages** (including through automated transformations…), where little value is provided"; "**Stitching or combining content from different web pages without adding value**."
- **Site reputation abuse — explicitly NOT a violation.** The policy's non-violation list names "**wire services or press releases**" and "**syndicated news content from other publications**." The Nov 2024 tightening did not remove this carve-out.
- **On 15 May 2026 Google formally extended all spam policies to AI Overviews and AI Mode** ([PPC Land](https://ppc.land/google-spam-policies-now-officially-cover-ai-overviews-and-ai-mode-in-search/)).
- **Helpful-content guidance (updated 10 Dec 2025)** asks two questions that are near-verbatim descriptions of this product: "**Are you mainly summarizing what others have to say without adding much value?**" and "Is the use of automation, including AI-generation, **self-evident to visitors through disclosures**?"
- **Enforcement cadence** ([Google's ranking-updates status history](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history)): 26 Aug 2025 spam update; 11 Dec 2025 core; **5 Feb 2026 Discover-specific update**; **24 Mar 2026 spam update**; 27 Mar 2026 core; 21 May 2026 core; **24 June 2026 spam update**. Two spam updates plus a dedicated Discover update in seven months.

**Google News / Discover eligibility:** Discover is **automatic** — "Content is automatically eligible to appear in Discover if it is indexed by Google." **Google News policies say nothing at all about aggregation, duplication, republication, or AI-generated content**; they require clear **dates, bylines, author/publisher identity, and contact information** ([support.google.com](https://support.google.com/news/publisher-center/answer/6204050)). Relevant manual actions: "**Good Neighbor Policy**" (content that "impersonates or **conceals the organization that created the content**"), Transparency, Impersonation, Major Spam Problems. **Publisher Center was gutted in March 2025** — custom sections, logos and titles removed in favour of automatically generated publication pages ([Search Engine Land, 11 Feb 2025](https://searchengineland.com/google-news-automated-publication-pages-to-start-in-march-451831)).

**Apple News** documents both an "AI-generated content" policy and a "Mark an article as AI-generated or syndicated" function — so AI and syndicated content are permitted **when labelled**. **NOT FOUND: Apple's actual eligibility criteria or any prohibition on republishing third-party content** — not in the public support index.

**Meta/Canada:** news links have been blocked on Facebook and Instagram in Canada since Aug 2023 under the Online News Act, unamended ([CBC](https://www.cbc.ca/news/politics/online-news-act-meta-facebook-1.6885634)).

**EU DSM Art. 15 press publishers' right**: 2-year term, aimed at aggregators. Excluded: hyperlinking, private non-commercial use, and "**individual words or very short extracts**" — **with no numeric definition, and badly fragmented national implementation**. And **CJEU, Meta Platforms Ireland v. AGCOM, 12 May 2026**: publishers have a right to fair compensation when platforms display news excerpts; platforms may not algorithmically demote publishers during negotiation; **does not apply to simple hyperlinking** ([EU Perspectives](https://euperspectives.eu/2026/05/eu-court-backs-publishers-as-meta-loses-news-snippets-fight/)) — *single-source, not corroborated.*

### 4.7 Scraping law, and two hard dates in the next seven weeks

**US scraping law keeps breaking toward scrapers.** **hiQ v. LinkedIn** (9th Cir. reaffirmed Apr 2022, 31 F.4th 1180) post-**Van Buren** — CFAA doesn't reach external scraping of public pages; **but N.D. Cal. found hiQ breached the User Agreement in Nov 2022.** **Meta v. Bright Data** (Jan 2024) and **X Corp. v. Bright Data** (dismissed May 2024, court called such scraping "**generally legal**" and warned of "information monopolies"). **Ryanair v. Booking.com** found a CFAA violation but on **password-protected access**. **Google v. SerpApi, 20 July 2026** (Judge Gonzalez Rogers) dismissed the DMCA §1201 claim.

**Robots.txt has no established legal force** — the **Ziff Davis** ruling (15 Dec 2025) dismissed §1201 **with prejudice** because "robots.txt files are 'mere requests' rather than technological controls." **But that is protective only as to §1201** — it doesn't touch direct infringement (which survived in the same order) or breach of contract. Reputationally: Cloudflare publicly accused Perplexity in **Aug 2025** of "stealth web crawlers," with CEO Matthew Prince saying it behaved "more like North Korean hackers."

**Two dates that belong in any disclosure schedule:**

1. **2 August 2026 — EU AI Act Article 50(4).** Binds **deployers**, not model vendors. Deployers of AI systems that "generate or manipulate text which is published with the purpose of informing the public on matters of public interest" must **disclose that the text is artificially generated**, with an exemption where content "has undergone a process of human review or editorial control" and a person "holds editorial responsibility" ([Art. 50](https://artificialintelligenceact.eu/article/50/)). *NOT VERIFIED whether the "Digital Omnibus" delays this date.*
2. **15 September 2026 — Cloudflare default-blocks "mixed-use" crawlers on ad-bearing pages**, applying to new customers, new sites of existing customers, and **all free-tier users**. Also shifting from Pay Per Crawl to **Pay Per Use** ([TechCrunch, 1 July 2026](https://techcrunch.com/2026/07/01/cloudflares-new-policy-pushes-ai-companies-to-pay-for-publishers-content/)). **This is the most concrete near-term threat to the asset's *operations*, independent of any lawsuit** — a large share of 50–200 news sources sit behind Cloudflare, and a buyer will ask what happens to ingest on that date.

### 4.8 The Claude API indemnity does not cover the core risk

**Anthropic Commercial Terms, effective 17 June 2025**: Anthropic defends against claims that "Customer's paid use of the Services… or Outputs… violates any third-party intellectual property right." **The exclusions gut it here:**
- **"(c) Inputs or other data provided by Customer"** — the RAG pipeline feeds scraped articles in as Inputs. That is the whole product.
- "(d) use… in a manner that Customer knows or reasonably should know violates or infringes the rights of others"
- "(f) trademark claims based on use of an Output in trade or commerce"

And the customer **warrants "it has all rights and permissions required to submit Inputs."**

**Anthropic Usage Policy, effective 15 Sept 2025** ([link](https://www.anthropic.com/legal/aup)) additionally requires, for "media or professional journalistic content… automatically generate content and publish it for external consumption," **human review by qualified professionals and disclosure that AI was used.** A fully automated aggregator publishing unreviewed Claude summaries is **out of policy on its face** — both a diligence finding and a platform-continuity risk on the one critical vendor. (Convenient alignment: the same human-review posture satisfies both the AUP and the EU AI Act Art. 50(4) exemption.)

### 4.9 The dossier layer carries a separate, non-copyright risk — possibly the sharper one

- **Walters v. OpenAI** (Ga. Super. Ct., **SJ for OpenAI 19 May 2025**) — disclaimers, no negligence, no actual malice, no damages ([Volokh](https://reason.com/volokh/2025/05/20/openai-wins-libel-lawsuit-brought-by-gun-rights-activist-over-hallucinated-embezzlement-claims/)).
- **But Starbuck v. Google** (Del. Super. Ct., **MTD DENIED 24 July 2026**) reverses that comfort: **disclaimers do not automatically defeat the claim at the pleading stage**; prior notice of falsity supports actual malice; publication adequately pleaded on an allegation that Google AI produced false statements to **2,843,917 unique users** ([Volokh, 24 July 2026](https://reason.com/volokh/2026/07/24/conservative-commentator-robby-starbucks-lawsuit-alleging-google-ai-had-defamed-him-can-go-forward/)). **Starbuck v. Meta settled Aug 2025.**
- **Grybniak v. Google / v. X.AI (2026)** extend liability from fabrication to **mischaracterization of real records** — alleging Gemini and Grok said "committed securities fraud" where the record showed a no-admission SEC settlement on registration violations. **This is the exact failure mode of an auto-generated politician/bill dossier.**
- **Section 230 will not help.** **Bouck v. Meta Platforms** (N.D. Cal., Chief Judge Seeborg, **27 Mar 2026**): §230 does not immunize AI-generated content — "Meta participated in the construction of the ads by **literally generating, using artificial intelligence, the images and text**… That degree of participation is not protected." **No ruling found holding that §230 *does* protect AI-generated summaries.**
- Lidsky & Daves, *Inevitable Errors: Defamation by Hallucination*, J. Free Speech L. (25 Nov 2025), cite a **3–10% hallucination rate** and argue those who repeat unverified hallucinations should face liability as "**cheapest cost avoiders**" — i.e. the republisher.

### 4.10 Does this kill acquirability?

**No — it compresses the buyer pool, caps the multiple, and makes deal structure the whole negotiation.** Findings:

1. The core legal question is **genuinely open and trending adverse**. For an acquirer this is the worst category — not "clearly illegal" (priceable) and not "clearly legal" (ignorable).
2. **There is no priceable remediation path** (§4.5), so no buyer can compute a compliance cost and bid against it.
3. **Google traffic dependency is the valuation risk; copyright is the liability risk. They are separate and both real.**
4. **NOT FOUND — and this is notable: no broker or acquirer has published *any* framework for pricing content-rights risk at this deal size.** Empire Flippers' general buyer checklists contain **no copyright or licensing step at all**; their content-related guidance treats AI/scraped content as an **SEO defect, not a copyright defect** ([SEO due diligence, 14 Mar 2024](https://empireflippers.com/seo-due-diligence/)). The one exception is their KDP piece (3 June 2026): "**a single unresolved [DMCA] claim can put the entire account at risk**" ([link](https://empireflippers.com/kdp-business-due-diligence-red-flags/)). Also relevant: the FTC's **Workado** order (final 28 Aug 2025) means a buyer **cannot clear a content library with an AI-detection tool either** ([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-order-requires-workado-back-artificial-intelligence-detection-claims)).
5. **One genuinely favourable negative finding: no bias-comparison aggregator has been sued.** Ground News has run a licensed-bias-ratings comparison aggregator since 2020 with **zero recorded litigation** — and it **licenses** its bias/factuality ratings from AllSides, MBFC, and Ad Fontes.

---

## 5. COMPARABLE ACQUISITIONS

### 5.1 Artifact → Yahoo — the closest structural analogue

**What Artifact had at shutdown:** launched 31 Jan 2023; **~444,000 lifetime downloads** (Feb 2023–Jan 2024), down to **12,000 new installs in Oct 2023**; 44% US; **MAU/DAU never disclosed**; **$0 revenue** — monetization never launched; self-funded by Systrom & Krieger at "**single-digit millions**," no outside round; **7 employees**. SmartNews did 2M downloads over the same window ([TechCrunch, 18 Jan 2024](https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/); [Wikipedia](https://en.wikipedia.org/wiki/Artifact_(app))).

**The deal, announced 2 April 2024:** price **UNDISCLOSED** — both sides declined, and **no credible public estimate exists**. Yahoo bought **technology only** — content categorization, curation, personalization/recommendation, AI summarization, clickbait-headline rewriting. Yahoo did **not** buy the team: Systrom and Krieger became **special advisors only**, and the **remaining five employees found jobs elsewhere or took time off** ([Yahoo press release](https://www.yahooinc.com/press/yahoo-announces-the-acquisition-of-artifact-the-news-discovery-platform-created-by-instagram-cofounders-kevin-systrom-and-mike-krieger); [Spyglass](https://spyglass.org/yahoo-artifact/)). The deal came **~2.5 months after the public shutdown announcement** — Yahoo bought a dead asset, not a going concern. Yahoo News relaunched 13 June 2024 with the Artifact stack.

**Read-through: the most-cited comparable in this category was a technology-only asset sale of a shut-down app, at an undisclosed price, with no team transfer. That structure — not a headline number — is the realistic template.**

### 5.2 Ground News — the closest *product* comparable

| Metric | Value | Source |
|---|---|---|
| Headcount | **18** | [Wikipedia](https://en.wikipedia.org/wiki/Ground_News) |
| Disclosed funding | Techstars seed **$20K** (2018); angel round 2019 (undisclosed); "Series A" Aug 2022 **$150K** — ~$170K total disclosed | [Dealroom](https://app.dealroom.co/companies/ground_news) |
| Company statement | "Not funded by a media company, big tech, government affiliations **nor institutional investors**" | [ground.news/about](https://ground.news/about) |
| Valuation | **NEVER DISCLOSED. No priced VC round found.** | — |
| Web traffic | **~8 million visits, July 2025** (Similarweb) | [CJR, 8 Sept 2025](https://www.cjr.org/analysis/the-business-of-balance-ground-news.php) |
| App | **#1 free news app on US App Store, spring 2025** | CJR |
| Subscribers / revenue | **Ground News declined to disclose** to CJR | CJR |
| Content scale | ~60,000 articles/day from 50,000+ sources; ~30,000 AI summaries/day; 40,000+ outlets rated | CJR |
| Distribution moat | **Most-sponsored brand on YouTube (2025)**: 1,863 integrations across 65,759 sponsored videos | Axios data via Wikipedia |
| Bias-rating supply chain | **Pays Ad Fontes Media**; uses **AllSides ratings without formal permission and without payment**; MBFC with no formal agreement | CJR |
| Acquisition rumours | **NONE FOUND** | — |

**Read-through:** the benchmark bias-comparison aggregator is **bootstrapped, has taken no institutional round, has no public valuation, and refuses to disclose subscribers.** There is no "Ground News comp multiple" to point at. Its moat is a YouTube-sponsorship machine, not technology.

### 5.3 Particle — $15.3M of top-tier VC into the same product category

Mina Labs Inc.; founders Sara Beykpour (ex-Twitter Sr. Dir. PM) and Marcel Molina. **Seed $4.4M + Series A $10.9M led by Lightspeed (11 June 2024) = ~$15.3M total**, 22 investors incl. Axel Springer. Publisher partners Reuters, AFP, Fortune. iOS launch 12 Nov 2024, web 6 May 2025. **Headcount 1–10. Web traffic 29,131 monthly visits, down 63.7% MoM.** Revenue not disclosed, no consumer paywall. **Status July 2026: still independent, no acquisition** — now selling a **B2B "Particle Podcast Intelligence API"** (100,000+ podcast transcripts), a pivot toward data/API licensing ([TechCrunch](https://techcrunch.com/2024/06/11/ai-news-reader-particle-adds-publishing-partners-and-10-9m-in-new-funding); [Crunchbase](https://www.crunchbase.com/organization/particle-news); [particle.news](https://particle.news/)).

### 5.4 Larger aggregators — the category is in retreat

| Company | Peak valuation | Decline |
|---|---|---|
| **SmartNews** | **$2.0B (Sept 2021, $230M round)**, ~$500M raised + $70M debt (Jan 2024) | Peak **10M US MAU → 5–6M worldwide MAU, 1.7M DAU** (2023, −30% YoY); downloads <25% of 2022 levels. **Jan 2023: 40% layoffs** (~120 people); CEO out Dec 2023 ([TechCrunch](https://techcrunch.com/2024/01/08/as-twitter-x-rivals-explode-news-aggregator-smartnews-struggles-to-retain-users/)) |
| **NewsBreak** | Series C 2021 **$115M** led by Francisco Partners; the widely repeated "$3B" **could not be confirmed** | **Paid Patch Media $1.75M** (2022) over unauthorized republication; Reuters found 40+ inaccurate AI-generated stories 2021–24 ([Wikipedia](https://en.wikipedia.org/wiki/NewsBreak)) |
| **Flipboard** | **>$200M raised**, incl. $50M from JPMorgan (July 2015) — newest hard datapoint | **21% staff cut Dec 2022**; pivoted to fediverse ([Gizmodo](https://gizmodo.com/flipboard-layoffs-big-tech-1849666292)) |
| **Post News** (a16z-backed) | undisclosed | **Shut down April 2024. No asset sale.** Founder Noam Bardin: "our service is not growing fast enough to become a real business" ([TechCrunch](https://techcrunch.com/2024/04/19/post-news-the-a16z-funded-twitter-alternative-is-shutting-down)) |
| **Techmeme** | **Zero outside investors**, "funded entirely by Rivera," ~6 staff | Never sold, never raised ([Wikipedia](https://en.wikipedia.org/wiki/Techmeme)) |
| **Otherweb** | undisclosed; 4 rounds; 11–50 employees | **ACQUIRED** — otherweb.com now displays "otherweb.com has been acquired by SAI Technologies." **Date and price NOT DISCLOSED**; phrasing suggests a domain/asset-level deal ([otherweb.com](https://otherweb.com/)) |

### 5.5 Newsletter / niche-media transactions — the actual price table

**Large deals (disclosed):**

| Date | Target | Acquirer | Price | Target metrics | Multiple |
|---|---|---|---|---|---|
| 8 Aug 2022 | **Axios** | Cox Enterprises | **$525M cash** | ~$100M revenue; 500+ employees; $55M raised | **~5.25x revenue** ([Axios](https://www.axios.com/2022/08/08/axios-agrees-to-sell-to-cox-enterprises-for-525-million)) |
| Jul 2022 | **Industry Dive** | Informa | **$525M EV / $389M cash** + earn-outs | ~$110M revenue; **30% profit margin**; ~380 employees; profitable since 2013 | **~4.8x revenue** ([Axios](https://www.axios.com/2022/07/19/industry-dive-informa-acquisition)) |
| Oct 2020 | **Morning Brew** | Insider Inc. | **$75M** controlling stake | 4M+ subscribers by Mar 2022 | ([CNBC](https://www.cnbc.com/2022/03/28/morning-brew-tops-4-million-subscribers-as-it-looks-to-expand-with-ma.html)) |
| Feb 2021 | **The Hustle** | HubSpot | **~$27M** | 1.5M+ subs; ~30 FTE; ~$1M raised; **profitable** | ([Axios](https://www.axios.com/2021/02/03/hubspot-acquisition-the-hustle)) |
| Aug 2023 | **Vice Media** | Fortress consortium (Ch.11) | **$350M** | ~$600M 2022 revenue; **peak valuation $5.7B (2017)** | **~0.6x revenue; 94% off peak** |

**Small/mid deals — the band that actually matters:**

| Date | Target | Acquirer | Price | Target metrics |
|---|---|---|---|---|
| Nov 2023 | **Morning Chalk Up** | BarBend / Pillar4 | **High six figures** | **75,000 subs, $900K annual revenue**, 70% open rate, 7 years old → **~<1x revenue** ([TheyGotAcquired](https://theygotacquired.com/content/morning-chalk-up-acquired-by-barbend/)) |
| Apr 2024 | **Really Good Emails** | Growens / Beefree | **$6.6M total = $600K upfront + $6M earnout through 2026** | **$250K annual revenue**, 220,000 subscribers, **100M annual pageviews**, 4 co-founders + 2 contractors. **Only $600K cash at close despite a huge audience** ([TheyGotAcquired](https://theygotacquired.com/content/really-good-emails-acquired-by-growens/)) |
| Jan 2025 | **The Neuron** (AI newsletter) | TechnologyAdvice | **UNDISCLOSED** — cash + earn-out | 500,000 subscribers, low-7-figure revenue, **1 founder + 3 contractors**, founded 2023 ([TheyGotAcquired](https://theygotacquired.com/content/the-neuron-acquired-by-technologyadvice/)) |
| Dec 2022 | **Milk Road** | Bitfo | **UNDISCLOSED** — cash + equity. One investor claimed "8-figure outcome," **unverified** | 250,000 subs, **~$1M ARR, 10 months old**; CAC $1.00–1.30/sub ([TheyGotAcquired](https://theygotacquired.com/content/milk-road-acquired-by-bitfo/)) |
| Oct 2024 | **Front Office Sports** (majority) | RedBird IMI | **UNDISCLOSED** | +85% YoY revenue; 35M monthly newsletter opens |
| Dec 2023 | **Chartr** | Robinhood / Sherwood | **UNDISCLOSED** | — |
| Dec 2023 | **Electo Analytics** (legislative data) | Punchbowl News | **UNDISCLOSED** |

**Private marks (no transaction):** **Semafor $330M** on $40M revenue / $2M EBITDA (7 Jan 2026, first profitable year, 1M+ subs, 55–60 journalists) → ~8.25x. **1440 $101M** on ~$27M revenue, **27 employees**, bootstrapped, **not for sale** → ~3.7x. **Punchbowl News >$100M** on ~$20M (2023), ~40 FTE → ~5x. **The Ankler $20M** (June 2022) on $1.5M from YC; ~$10M revenue 2025, **145,000 paid**, 14 staff. **Tangle** — the closest *editorial* analogue to a bias-comparison product — **$4.15M revenue (2025)**, 85% subs / 15% ads, **71,000 paid, 500,000+ free, 16% free→paid conversion, 12 FTE, no outside capital** ([Press Gazette, 11 Mar 2026](https://pressgazette.co.uk/newsletters/politics-newsletter-makes-nearly-4m-in-subs-despite-giving-most-content-away/)).

**Shutdowns with no sale:** **The Messenger** raised **$50M**, made **$3M in 8 months**, launched May 2023, shut **31 Jan 2024**, ~300 people laid off with **no severance**, class action filed, **no buyer and no asset sale**. **Post News** — no buyer. **Sherwood News** (Robinhood) — **shut down 13 July 2026**, nearly all editorial laid off ([Nieman Lab](https://www.niemanlab.org/reading/stock-trading-app-robinhood-shuts-down-sherwood-news/)).

### 5.6 Civic tech / political data — the one strategic consolidator is in retreat

| Date | Event | Price |
|---|---|---|
| Mar 2024 | **FiscalNote sells Board.org** to Executive Platforms | **$95M cash + earnout, up to $103M.** FiscalNote had bought it in 2021 for **$14.3M** → ~7x in 3 years. Repaid $65.7M senior debt ([Businesswire](https://www.businesswire.com/news/home/20240312080030/en/FiscalNote-Announces-Sale-of-Board.Org-Community-Engagement-Platform-for-up-to-$103-Million-in-Total-Consideration)) |
| Mar 2025 | **FiscalNote sells Oxford Analytica + Dragonfly** to Dow Jones | **$40M total, ~$27.1M net** ([Businesswire](https://www.businesswire.com/news/home/20250331614100/en/FiscalNote-Closes-Previously-Announced-Divestiture-of-Non-Core-Assets-to-Accelerate-Profitability-and-Strengthen-Balance-Sheet)) |
| **Mar 2026** | **FiscalNote delisted from NYSE, now trades OTC**; **laid off Curate's entire staff without notice** | ([Wikipedia](https://en.wikipedia.org/wiki/FiscalNote)) |
| Sept 2022 | **Quorum acquires Capitol Canary** (fka Phone2Action) | **UNDISCLOSED.** Capitol Canary had 1,200 client orgs; combined co 2,000+ clients, 336 employees ([Quorum](https://www.quorum.us/company-news/quorum-acquires-capitol-canary-public-affairs-software-leaders/)) |
| May 2019 | **Countable acquires Brigade/Causes — IP and data only** | **UNDISCLOSED.** Brigade raised **$9.3M Series A** from Sean Parker. **Engineering team sold separately to Pinterest.** CEO: "Brigade had not achieved the user scale we know is required" ([TechCrunch](https://techcrunch.com/2019/05/01/brigade-countable/)) — **the closest structural precedent to Artifact/Yahoo in civic tech** |
| — | **ProPublica Congress API** | **Shut down.** Docs now read: "no longer available… should only be used as a historical reference" ([ProPublica](https://projects.propublica.org/api-docs/congress-api/)) |

**Civic-tech nonprofit financial reality:** **OpenSecrets** — 2023 revenue $2.5M vs **expenses $4.3M**; **laid off one-third of staff in 2024** amid "serious financial difficulties." **Ballotpedia** $5.37M (2019, most recent found). **Vote Smart** sold its Montana HQ ranch (2016) and serially relocated for cost.

### 5.7 What a zero-revenue news/content asset actually fetches

**There is no public transaction in 2022–2026 where a zero-revenue news aggregator sold for a disclosed price.** The evidence points one direction:

- **Artifact** — Instagram founders, 7 engineers, 444K downloads, $0 revenue → **tech only, no team, price never disclosed, and only after announcing its own death**
- **Brigade/Causes** — $9.3M raised, 250K users, no revenue → **IP-and-data-only, undisclosed, engineering team monetized separately**
- **The Messenger** — $50M raised, $3M revenue → **no buyer at all**
- **Post News** — a16z-backed → **no buyer**
- **Really Good Emails** — $250K revenue, 220K subs, 100M pageviews/yr → **$600K cash at close**
- **Morning Chalk Up** — $900K revenue → **high six figures, <1x revenue**

**Synthesis:** a zero-revenue news product does not command a revenue or profit multiple because there is nothing to multiply. Every observed outcome is (1) an **undisclosed IP/tech-only sale to a strategic** with existing distribution, (2) an **acquihire** where the team is often sold *separately from the product*, or (3) **no sale at all**. Where money did change hands for small content assets with *some* revenue, prices clustered at **~1x revenue in cash**, with anything above structured as earnout.

**Pattern worth noting on price disclosure:** in OpenAI's confirmed M&A ledger, **every small consumer-app acquisition is undisclosed** (Global Illumination, Multi, Roi, Software Applications Inc., Neptune); only the large infrastructure deals get numbers (io $6.5B, Statsig $1.1B, Torch ~$60M) ([Wikipedia](https://en.wikipedia.org/wiki/OpenAI)). A small consumer AI product being bought without a public price is the norm — but it also means **there is no public benchmark to anchor a price to.**

---

## 6. ALTERNATIVE EXITS

### 6.1 Acquihire

**The 2024–2026 "reverse acquihire" wave** — verified deal facts:

| Deal | Date | Structure | Headcount | Implied |
|---|---|---|---|---|
| **Microsoft ← Inflection AI** | Mar 2024 | **$650M licensing fee**, "used to reimburse Inflection AI's investors." UK CMA investigated as a possible merger, cleared it | **~70 people** | **≈$9.3M/head** ([Wikipedia](https://en.wikipedia.org/wiki/Inflection_AI)) |
| **Amazon ← Covariant** | Aug 2024 | **$380M + $20M** licensing = **$400M**, below its $625M 2023 valuation. Explicitly structured "to circumvent antitrust scrutiny." Whistleblower complaint alleged **founders paid out while other investors and employees were diluted** | ~25% of workforce | ([Wikipedia](https://en.wikipedia.org/wiki/Covariant_(company))) |
| **Google ← Character.AI** | Aug 2024 | Non-exclusive tech licence + hired CEO Shazeer. **Value not confirmable from a primary source** — the widely cited ~$2.7B is **UNVERIFIED** | Founders + researchers | ([Wikipedia](https://en.wikipedia.org/wiki/Character.ai)) |
| **Meta ← Scale AI** | Jun 2025 | **$14.8B for 49% non-voting**, ~$30.2B implied | Alexandr Wang → Meta | ([Wikipedia](https://en.wikipedia.org/wiki/Scale_AI)) |
| **Google ← Windsurf** | Jul 2025 | **"$2.4 billion acquihire" of leadership** (licence + hires, not acquisition); remainder to Cognition 14 July 2025 | CEO + senior staff | ([Wikipedia](https://en.wikipedia.org/wiki/Cognition_AI)) |
| **OpenAI ← Statsig** | Sep 2025 | **$1.1B all-stock**; founder became CTO of Applications | Whole company | ([Wikipedia](https://en.wikipedia.org/wiki/OpenAI)) |

**What these signal:** the structure is *licence the tech non-exclusively + hire the people + pay investors out through the licence fee, and leave a husk behind.* It exists to avoid HSR merger review. **The price is set by scarcity of frontier-AI research talent, not by product, users, or revenue.** Every target had a raised valuation in the hundreds of millions to billions and a team of recognized researchers.

**Can a solo non-FAANG builder acquihire? NOT FOUND: any published per-engineer pricing benchmark for ordinary small acquihires in 2025–2026.** Wikipedia's [Acqui-hiring](https://en.wikipedia.org/wiki/Acqui-hiring) article contains no per-engineer figures and no 2024–26 data, and concedes "the benefits of these acquisitions compared to other forms of hiring is unclear." The often-cited $500k–$2M/engineer figure is from the 2011–2015 era and **could not be verified from a primary source** (the Duke Law Journal Coyle & Polsky paper returned 403 on every access path). **Do not rely on a per-engineer number.**

What *is* verified: acquihires are priced on **team scarcity** and typically applied to funded companies with **investors to make whole**. A solo builder with no investors, no team to absorb, and no institutional signal has nothing to acquihire — the acquirer's cheaper path is a job offer. **Structurally, "acquihire" for a solo founder collapses into "get hired, and maybe they take the repo as a nice-to-have."**

### 6.2 Licensing the tech or dataset

**The AI-content licensing market is real and priced — but only for original, owned content at scale.** The buyers pay for **rights to content the seller owns**. An aggregator that summarizes other people's journalism owns none of the underlying rights, so has nothing licensable — and, post-*Cohere*, arguably holds a liability rather than an asset.

**Intermediaries:** **ProRata.ai** — 1,000+ publications, **50% revenue share**, partners incl. The Atlantic, Fortune, Axel Springer; **no per-unit rates published** ([prorata.ai](https://prorata.ai/)). **Human Native AI has been acquired by Cloudflare** (per notice on their own homepage) — that independent marketplace door is closing ([humannative.ai](https://www.humannative.ai/)). **NOT FOUND: pricing from TollBit (dollar figures are inside gated reports), ScalePost, Defined.ai (pricing URLs 404), or Bright Data (fetch blocked).**

**Alt-data channel:** **Neudata** tracks **7,000+ datasets** and states "**investment managers spent approximately $2.8bn on alternative data in 2025**," claiming to facilitate **$250M/year** in data product transactions. **Median/average dataset price is not published** ([neudata.co](https://www.neudata.co/)).

**The structural problem: legislative/political data is commoditized.**
- **LegiScan gives away a free API at 30,000 queries/month** covering bill details, status, sponsors, full texts, and roll calls for **all 50 states and Congress** — the same database as its paid tiers, which differ only by query volume and delivery method ([legiscan.com](https://legiscan.com/legiscan)).
- **Open States** now redirects to **Plural Policy** — the canonical open legislative dataset was absorbed by a commercial platform rather than sold as a dataset.
- **FiscalNote**, the one consolidator that historically rolled up this exact category (VoterVoice, CQ Roll Call, FactSquared, Oxford Analytica, Forge.AI, Curate, Dragonfly), was **delisted from the NYSE in March 2026** and **laid off Curate's entire staff without notice**.

**NOT FOUND: any public price point for a structured political/legislative dataset licence.** The free-API baseline strongly suggests the answer is near zero.

### 6.3 Selling the domain

**DNJournal's 2026 year-to-date sales chart** (through 19 July 2026) is the industry's public record ([dnjournal.com/ytd-sales-charts.htm](https://www.dnjournal.com/ytd-sales-charts.htm)):
- Top: AI.com **$70,000,000**; Club.com $10M; Green.com $7.5M; NAS.com $1.25M; Bot.ai $1.2M; HighLevel.com $1.0M
- **The .com chart falls below $50,000 around position #68**; the non-.com gTLD chart reaches **$10,000 around position #65**
- **Civic-adjacent names top out in the low five figures**: IdentityTheft.org **$30,000**; Pay-Equity.org **$46,000**; CampusPride.org **$47,500** — and these are the *reported top sales* in their category
- Escrow.com settlement fees: 2.6% under $5k ($50 min); 2.4% $5k–50k ($130 min)

**NOT FOUND: average or median aftermarket prices from Sedo (redirect loop), NameBio (403), Afternic (no published rates), or GoDaddy (blocked).** What DNJournal establishes is the *shape*: the publicly reported market thins out below ~$10k, so the unreported mass market for non-premium brandables sits below that. A coined/compound brandable with no dictionary-word or exact-match value is a low-four-figures-or-less asset unless someone specifically wants that string.

### 6.4 Open-sourcing with a commercial layer

The clearest verified solo-dev open-core exit is **Nginx**: created by **Igor Sysoev alone** starting 2002, released 2004; **Nginx Inc. founded July 2011**; commercial support Feb 2012; paid subscription Aug 2013; **acquired by F5 for $670 million, 11 March 2019** ([Wikipedia](https://en.wikipedia.org/wiki/Nginx)). That is a **15-year arc**, and the acquisition happened only after a funded company, an enterprise product, and an enormous installed base existed.

**Other claimed examples do not check out.** **Caddy** — Wikipedia names no sole creator and **contains no acquisition information at all**. **Sidekiq** — Mike Perham's blog has **no post about a sale**, and 2025–2026 posts still show him running Sidekiq Pro and Faktory ([mikeperham.com](https://www.mikeperham.com/)). **NOT FOUND: any example of a solo dev open-sourcing a product and being acquired as a direct result within a short horizon.**

Note the one-way door: open-sourcing forecloses most of the outright-sale option, since a buyer paying for Apache-licensed code is buying only brand and maintainer relationship.

### 6.5 Nonprofit / journalism-funder route

| Funder | Verified figures |
|---|---|
| **Press Forward** | **$400M+ invested in local news**; 130 funders; 46 local chapters. **Grant sizes and open-call details not published** — their /what-we-fund/ and /grants/ URLs 404 ([pressforward.news](https://www.pressforward.news/)) |
| **Knight Foundation** | **$150M commitment**, doubling journalism funding over five years. Program area "Technology, AI and Product Innovation" funds "tools that improve workflows, audience engagement and decision-making." **Typical grant sizes not disclosed.** Invests in **26 specific communities** ([knightfoundation.org](https://knightfoundation.org/programs/journalism/)) |
| **Lenfest AI Collaborative & Fellowship** | **$10M total**, funded by Lenfest + OpenAI + Microsoft. **11 news organisations** each got a grant to hire a **two-year AI fellow**, plus OpenAI/Azure credits. Grantees incl. Baltimore Banner, Boston Globe, ProPublica, Philadelphia Inquirer. **Applications currently closed** ([lenfestinstitute.org](https://www.lenfestinstitute.org/our-work/lenfest-ai-collaborative-and-fellowship-program/)) |
| **Lenfest "Every Voice, Every Vote"** | **$1.8M total**, two-year civic news program, **accepting applications for 2026–2027**. Philadelphia-focused |
| **Google News Initiative** | **$300M+ deployed**, 7,000+ partners. **No current program names, budgets, or eligibility criteria published** ([newsinitiative.withgoogle.com](https://newsinitiative.withgoogle.com/)) |
| **Patrick J. McGovern Foundation** | Funds AI/data across journalism and civic tech. **Grant amounts and eligibility not published** ([mcgovern.org](https://www.mcgovern.org/our-work/)) |

**Explicit caveat: NOT FOUND — whether any of these funders will fund a for-profit solo builder. And none of them *buy* tools.** The observable pattern across every verified program is that **money flows to newsrooms and nonprofit institutions to hire people or build internally**, not to independent vendors as acquisitions. The Lenfest structure illustrates it: the $10M funded *fellows inside newsrooms plus API credits*, not the purchase of an outside product.

**The one adjacent precedent for the *mechanism*:** **Mastodon** — the team announced transition to a European non-profit in Jan 2025; founder Eugen Rochko stepped down as CEO **18 Nov 2025** and received **a one-time payment of €1,000,000 "for his past contributions"** ([Wikipedia](https://en.wikipedia.org/wiki/Mastodon_(social_network))). But Mastodon had years of crowdfunding, millions of users, and a global brand first. **Precedent for the mechanism, not the amount.**

---

## 7. CONSOLIDATED GAPS — DO NOT FILL THESE WITH ESTIMATES

| Item | Status |
|---|---|
| What zero-revenue web apps actually clear on Acquire.com or Flippa | **No marketplace publishes it.** Treat any "$2k–$5k" blog claim as unverified anecdote |
| Merits ruling on whether RAG news summarization is fair use | **Does not exist.** Every RAG case is at/near pleading stage |
| Yahoo/Artifact price | **Genuinely undisclosed.** No outlet published even a range. Do not let anyone cite a number |
| Ground News subscribers, ARR, valuation, full funding history | **Not disclosed.** Growjo's $5.7M revenue estimate is algorithmic — **do not cite as fact** |
| AP, Reuters, AFP licensing prices; small-publisher wire feed cost | **No public data.** All quote-only; Gannett declined to disclose |
| Per-article / per-crawl / per-token AI content licensing rates | **Not public.** OMI (May 2026) and Brookings both call the market opaque |
| Perplexity Publishers Program revenue-share percentage | **Never disclosed** |
| Published multiples for AI-wrapper products as an asset class | **No marketplace has broken this out** |
| Escrow %, holdback, survival periods for sub-$1M online deals | **No published benchmark.** ABA study floor is $25M; SRS Acquiom gated |
| Standard reps & warranties package for sub-$1M internet deals | **No broker publishes model language** |
| RWI minimum deal size and 2025–26 premiums | **Not found.** Best datum is stale: ABA June 2022, 3.5% rate on line |
| Published valuation discount for unlicensed content or Google penalty risk | **Does not exist** in broker literature |
| Any writeup treating AI/scraped content as a *copyright* (vs SEO) defect in site M&A | **Does not exist** in reachable sources |
| Per-engineer pricing for ordinary (non-frontier-AI) small acquihires 2025–26 | **No primary source** |
| Character.AI–Google deal value | **Unverified.** The ~$2.7B figure could not be confirmed from a primary source |
| Cash vs seller-financing vs earnout split on Acquire.com deals | **Their own report declines to break it out** |
| Average/median domain aftermarket price and marketplace commission rates | **Sedo, NameBio, GoDaddy, Afternic all unreachable or unpublished** |
| Any public price for a structured political/legislative dataset licence | **Not found.** Free-API baseline (LegiScan) suggests near zero |
| Grant eligibility for a for-profit solo builder at Knight, Press Forward, GNI, McGovern | **None of the reachable pages state it** |
| Duuce (listing sizes, fees, activity) | **robots.txt blocked** — no data |
| Apple News eligibility criteria and third-party-content rules | **Not in public support docs** |
| Whether the EU "Digital Omnibus" delays the 2 Aug 2026 Art. 50 date | **Not verified** |
| Otherweb → SAI Technologies: date, price, company-vs-domain sale | **All unknown** |
| Bulletin (Meta), Feedly, Inoreader, LegiStorm, Workweek, The Daily Upside | **No data retrieved** |

---

## THE THREE FINDINGS THAT MATTER MOST

1. **Every venue that produces a real price requires profit this asset doesn't have, and every venue that accepts pre-revenue listings produces no price discovery.** Empire Flippers ($1,500/mo net profit, 91% rejection), Acquire.com (median 3.9x *profit*, $100k+ TTM for advisory), Flippa (formula is monthly net profit × multiple), Tiny ($3M+ profit). The Flippa $29 tier, SideProjectors, and IndieMaker will take the listing — and publish nothing about what clears.

2. **The comparable set says the realistic outcome is an undisclosed tech-only asset sale to a strategic, or no sale.** Artifact — Instagram's founders, 7 engineers, 444K downloads, $0 revenue — sold **technology only, no team, undisclosed price, 2.5 months after announcing its own shutdown**. Brigade/Causes did the same in civic tech, with the engineering team monetized separately to Pinterest. The Messenger burned $50M and found no buyer at all.

3. **The legal posture is the specific thing that compresses the buyer pool, and it is worse for a RAG summarizer than for an AI lab.** Every favorable fair-use ruling (Alsup, Chhabria, UK Getty) is a *training* ruling that does not transfer. The two rulings that bear directly on AI news summaries — *Cohere* (14 Nov 2025) and Stein's order (27 Oct 2025) — both went the other way at the pleading stage, and the closest pre-AI analogue (*Meltwater*, 2013) went for the publisher on all four factors. Compounding it: **no priceable remediation path exists** (licences run $5M–$50M/yr; intermediaries publish no rates), **the Anthropic indemnity explicitly excludes "Inputs provided by Customer"** — the whole product — and **the dossier layer carries independent defamation exposure** that *Starbuck v. Google* (MTD denied 24 July 2026) and *Bouck v. Meta* (§230 doesn't cover AI-generated content, 27 Mar 2026) have just made materially worse. The one genuinely favorable finding: **no bias-comparison aggregator has ever been sued**, and Ground News has operated since 2020 by *licensing* its bias ratings rather than deriving them.agentId: a46fc7798f104aeae (use SendMessage with to: 'a46fc7798f104aeae', summary: '<5-10 word recap>' to continue this agent)
<usage>subagent_tokens: 139407
tool_uses: 31
duration_ms: 7934792</usage>