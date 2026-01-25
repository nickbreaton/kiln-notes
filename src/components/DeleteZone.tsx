import { Trash2 } from "lucide-react";

export const DeleteZone = () => {
  return (
    <div className="flex h-30 w-full items-end justify-center gap-2 bg-linear-to-b from-cream-50/0 via-cream-50/70 to-cream-50 pb-5 text-ink-400">
      <Trash2 className="h-6 w-6" aria-hidden="true" />
      <span className="text-sm font-medium">Drop to delete</span>
    </div>
  );
};
