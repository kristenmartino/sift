import { formatBillIdDisplay, formatBillStatusLabel } from "@/lib/bill";
import { getBillById } from "@/lib/db";
import { clampOgTitle, OG_SIZE } from "@/lib/og";
import { createDossierOgImage } from "@/lib/ogImage";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Bill dossier on Sift — the news, with footnotes";

export default createDossierOgImage({
  eyebrow: "Bill dossier",
  load: ({ id }: { id: string }) => getBillById(id),
  card: (bill) => ({
    title: bill.shortTitle ?? clampOgTitle(bill.title),
    meta: [formatBillIdDisplay(bill.billId), formatBillStatusLabel(bill.status)]
      .filter(Boolean)
      .join(" · "),
  }),
});
