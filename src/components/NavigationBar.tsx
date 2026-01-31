import { useAtomSet } from "@effect-atom/atom-react";
import { Plus } from "lucide-react";
import { createPiecesAtom } from "../effect/client/atom";

const FilePickerButton = ({
  onChange,
}: {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-kiln-600 active:bg-kiln-500">
    <input
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      onChange={onChange}
      className="absolute inset-0 opacity-0 cursor-pointer"
      aria-label="Add piece"
    />
    <Plus className="h-7 w-7 text-white pointer-events-none" aria-hidden />
  </label>
);

export const NavigationBar = () => {
  const createPieces = useAtomSet(createPiecesAtom, { mode: "promise" });

  return (
    <div className="h-16">
      <header className="fixed top-0 left-0 right-0 z-10 border-b border-cream-200 bg-white h-16 flex items-center">
        <div className="w-full mx-auto max-w-lg justify-between px-5 flex items-center">
          <h1 className="text-[20px] font-semibold text-ink-900">Kiln Notes</h1>
          <FilePickerButton
            onChange={(event) => {
              const files = Array.from(event?.target?.files ?? []);
              createPieces(files).then(() => {
                event.target.value = "";
              });
            }}
          />
        </div>
      </header>
    </div>
  );
};
