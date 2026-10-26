"use client";

import { useId, useState } from "react";
import type { FeedOrder, FeedWindow, FeedFormat } from "@/lib/feedView";

interface FeedControlsProps {
  order: FeedOrder;
  window: FeedWindow;
  format: FeedFormat;
  total: number;
  visible: number;
  onOrder: (value: FeedOrder) => void;
  onWindow: (value: FeedWindow) => void;
  onFormat: (value: FeedFormat) => void;
}

const FORMAT_LABELS: Record<FeedFormat, string> = { all: "All formats", groups: "Grouped coverage", opinion: "Includes opinion", digests: "Digests", video: "Videos" };

/** Secondary controls stay available without displacing the first story. */
export default function FeedControls({ order, window, format, total, visible, onOrder, onWindow, onFormat }: FeedControlsProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const filtered = window !== "all" || format !== "all";
  const changed = filtered || order !== "recommended";
  const selection = [order === "latest" ? "Latest" : "Recommended", window === "day" ? "Past 24 hours" : "All dates", ...(format !== "all" ? [FORMAT_LABELS[format]] : [])].join(" · ");
  const selectClass = "px-2 py-2 rounded-[8px] border border-(--border) bg-(--surface-raised) text-(--text-primary) text-sm max-w-full";

  return <div className="mb-4">
    <div className="md:hidden flex items-center justify-between gap-3 text-xs text-(--text-secondary)">
      <div className="min-w-0">
        <p className="md:hidden leading-relaxed">{selection}</p>
        <p className="text-xs mt-0.5" role="status">{filtered ? `${visible} of ${total} stories` : `${total} stories in this view`}</p>
      </div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className="md:hidden shrink-0 px-3 py-2 border border-(--border) rounded-[8px] bg-transparent text-(--text-primary) text-xs cursor-pointer">
        Filters <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
    </div>
    <div id={id} className={`${open ? "flex" : "hidden"} md:flex flex-wrap items-end gap-x-4 gap-y-2 mt-3 md:mt-0`}>
      <label className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-(--text-secondary)">Order
        <select aria-label="Feed order" className={selectClass} value={order} onChange={(event) => onOrder(event.target.value as FeedOrder)}>
          <option value="recommended">Recommended</option><option value="latest">Latest in this view</option>
        </select>
      </label>
      <label className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-(--text-secondary)">Published
        <select aria-label="Publication date filter" className={selectClass} value={window} onChange={(event) => onWindow(event.target.value as FeedWindow)}>
          <option value="all">All dates</option><option value="day">Past 24 hours</option>
        </select>
      </label>
      <label className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-(--text-secondary)">Format
        <select aria-label="Story format filter" className={selectClass} value={format} onChange={(event) => onFormat(event.target.value as FeedFormat)}>
          {Object.entries(FORMAT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <p className="hidden md:block text-xs text-(--text-secondary) py-2">{filtered ? `${visible} of ${total} stories` : `${total} stories in this view`}</p>
      {changed && <button type="button" onClick={() => { onOrder("recommended"); onWindow("all"); onFormat("all"); }}
        className="py-2 bg-transparent border-none text-xs text-(--accent) cursor-pointer hover:underline">Reset filters</button>}
      <p className="w-full text-xs text-(--text-secondary) leading-relaxed">These controls apply to the stories loaded in this view. Dates refer to publication, not when an event happened.</p>
    </div>
  </div>;
}
