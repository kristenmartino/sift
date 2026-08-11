import { ImageResponse } from "next/og";

import { formatBillIdDisplay, formatBillStatusLabel } from "@/lib/bill";
import { getBillById } from "@/lib/db";
import { clampOgTitle, dossierOgCard, loadOgFonts, OG_SIZE } from "@/lib/og";

// Same heartbeat as the page — the unfurl should never outlive the dossier.
export const revalidate = 600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Bill dossier on Sift — the news, with footnotes";

interface OgProps {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: OgProps) {
  const { id } = await params;
  const [bill, fonts] = await Promise.all([getBillById(id), loadOgFonts()]);

  if (!bill) {
    return new ImageResponse(
      dossierOgCard({ eyebrow: "Bill dossier", title: "Sift" }),
      { ...size, fonts },
    );
  }

  const meta = [
    formatBillIdDisplay(bill.billId),
    formatBillStatusLabel(bill.status),
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    dossierOgCard({
      eyebrow: "Bill dossier",
      title: bill.shortTitle ?? clampOgTitle(bill.title),
      meta,
    }),
    { ...size, fonts },
  );
}
