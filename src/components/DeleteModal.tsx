import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Trash2 } from "lucide-react";

type DeleteModalProps = {
  count?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const DeleteModal = ({
  count = 3,
  open,
  onOpenChange,
}: DeleteModalProps) => {
  const rootProps = open === undefined ? {} : { open, onOpenChange };

  return (
    <AlertDialog.Root {...rootProps}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 min-h-dvh bg-black/50 supports-[-webkit-touch-callout:none]:absolute" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 w-[320px] max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-500/10">
              <Trash2 className="h-6 w-6 text-danger-500" aria-hidden="true" />
            </div>
            <AlertDialog.Title className="text-lg font-semibold text-ink-900">
              Delete {count} pieces?
            </AlertDialog.Title>
            <AlertDialog.Description className="max-w-65 text-center text-sm text-ink-500">
              This action cannot be undone. These pieces will be permanently
              removed.
            </AlertDialog.Description>
          </div>
          <div className="h-px w-full bg-cream-200" />
          <div className="grid `h-12.5` grid-cols-2">
            <AlertDialog.Close className="flex h-full items-center justify-center border-r border-cream-200 text-base font-medium text-ink-900">
              Cancel
            </AlertDialog.Close>
            <AlertDialog.Close className="flex h-full items-center justify-center text-base font-semibold text-danger-500">
              Delete
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
