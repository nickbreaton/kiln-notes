import type { ReactNode } from "react";

type SectionStatus = "drying" | "bisking" | "glazed" | "complete";

const statusDotClasses: Record<SectionStatus, string> = {
  drying: "bg-status-drying",
  bisking: "bg-status-bisking",
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
      <div className="flex items-center gap-2 px-5">
        <span className={`h-2 w-2 rounded-full ${statusDotClasses[status]}`} />
        <span className="text-sm font-semibold text-ink-500">{title}</span>
        <span className="text-sm font-medium text-ink-400">{count}</span>
      </div>
      {children}
    </section>
  );
};
