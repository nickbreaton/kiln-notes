type SlotStatus = "drying" | "bisquing" | "glazed" | "complete";

type PieceSlotProps = {
  variant: "empty" | "target";
  status?: SlotStatus;
};

const borderByStatus: Record<SlotStatus, string> = {
  drying: "border-status-drying",
  bisquing: "border-status-bisquing",
  glazed: "border-status-glazed",
  complete: "border-status-complete",
};

const bgByStatus: Record<SlotStatus, string> = {
  drying: "bg-status-drying-light",
  bisquing: "bg-status-bisquing-light",
  glazed: "bg-status-glazed-light",
  complete: "bg-status-complete-light",
};

export const PieceSlot = ({ variant, status = "drying" }: PieceSlotProps) => {
  if (variant === "target") {
    return (
      <div
        className={`h-27.5 w-27.5 rounded-xl border-2 ${borderByStatus[status]} ${bgByStatus[status]}`}
      />
    );
  }

  return (
    <div className="h-27.5 w-27.5 rounded-xl border-2 border-cream-200 bg-transparent" />
  );
};
