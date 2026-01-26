import type { ReactNode } from "react";

type SectionStatus = "drying" | "bisquing" | "glazed" | "complete";

const statusDotClasses: Record<SectionStatus, string> = {
  drying: "bg-status-drying",
  bisquing: "bg-status-bisquing",
  glazed: "bg-status-glazed",
  complete: "bg-status-complete",
};

type PiecesSectionProps = {
  title: string;
  count: number;
  status: SectionStatus;
  children: ReactNode;
};

export const PiecesSection = ({
  title,
  count,
  status,
  children,
}: PiecesSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 px-5">
        <span
          className={`h-2 w-2 rounded-full ${statusDotClasses[status]}`}
          aria-hidden
        />
        <span className="text-sm font-semibold text-ink-500">{title}</span>
        <span className="text-sm font-medium text-ink-400">{count}</span>
      </h2>
      <div className="grid grid-cols-3 gap-2 px-5">{children}</div>
    </section>
  );
};
