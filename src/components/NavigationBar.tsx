import { useAtomSet } from "@effect-atom/atom-react";
import { Plus } from "lucide-react";
import { createPieceAtom } from "../effect/client/atom";
import { IconButton } from "./IconButton";

const FilePickerButton = ({
  onChange,
}: {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <IconButton render={<label />} aria-label="Add piece" nativeButton={false}>
    <span className="sr-only">Add piece</span>
    <input type="file" hidden onChange={onChange} multiple />
    <Plus className="h-5 w-5" aria-hidden />
  </IconButton>
);

export const NavigationBar = () => {
  const createPiece = useAtomSet(createPieceAtom, { mode: "promise" });

  return (
    <div className="h-14">
      <header className="fixed top-0 left-0 right-0 z-10 border-b border-cream-200 bg-white h-14 flex items-center">
        <div className="w-full mx-auto max-w-97.5 justify-between px-5 flex items-center">
          <h1 className="text-xl font-semibold text-ink-900">Kiln Notes</h1>
          <FilePickerButton
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                createPiece(file)
                  .then(() => {
                    event.target.value = "";
                  })
                  .catch(console.error);
            }}
          />
        </div>
      </header>
    </div>
  );
};
