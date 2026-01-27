import { useAtomSet } from "@effect-atom/atom-react";
import { Plus } from "lucide-react";
import { createPieceAtom } from "../effect/client/atom";
import { IconButton } from "./IconButton";

export const NavigationBar = () => {
  const createPiece = useAtomSet(createPieceAtom, { mode: "promise" });

  return (
    <div className="h-14">
      <header className="fixed top-0 left-0 right-0 z-10 border-b border-cream-200 bg-white h-14 flex items-center">
        <div className="w-full mx-auto max-w-97.5 justify-between px-5 flex items-center">
          <h1 className="text-xl font-semibold text-ink-900">Kiln Notes</h1>
          {/*<input
            type="file"
            onChange={(event) => {
              // TODO: this needs to handle multiple files
              const file = event.target.files?.[0];
              if (file)
                createPiece(file)
                  .then(() => {
                    event.target.value = "";
                  })
                  .catch(console.error);
            }}
          />*/}
          <IconButton aria-label="Add piece">
            <Plus className="h-5 w-5" />
          </IconButton>
        </div>
      </header>
    </div>
  );
};
