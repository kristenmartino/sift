"use client";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20 px-5">
      <div
        className="text-[80px] leading-none mb-6 text-[var(--accent)]"
        style={{ opacity: 0.15 }}
      >
        &#x25C6;
      </div>
      <p className="font-heading text-lg font-bold text-[var(--text-secondary)] mb-2">
        {title}
      </p>
      <p className="text-sm text-[var(--text-muted)] max-w-[360px] mx-auto leading-relaxed mb-5">
        {body}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[var(--accent)] text-white border-none px-7 py-2.5 rounded-full text-sm font-semibold cursor-pointer font-body hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
