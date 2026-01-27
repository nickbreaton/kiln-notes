import { registerSW } from "virtual:pwa-register";
import { NavigationBar } from "./NavigationBar";
import { Piece } from "./Piece";
import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { PiecesSection } from "./PiecesSection";
import {
  collectionAtom,
  deletePieceAtom,
  getPhotoUrlAtom,
} from "../effect/client/atom";

registerSW({ immediate: true });

const Photo = ({
  id,
  children,
}: {
  id: string;
  children: (src?: string) => React.ReactNode;
}) => {
  const url = useAtomValue(getPhotoUrlAtom(id));
  return children(Result.isSuccess(url) ? url.value : undefined);
};

export const App = () => {
  const atomValue = useAtomValue(collectionAtom);
  const deletePiece = useAtomSet(deletePieceAtom);

  return (
    <div>
      <NavigationBar />
      <div className="mx-auto min-h-screen max-w-lg w-full">
        <main className="flex flex-col gap-6 pb-8 pt-5">
          {/* tmp */}

          {Result.isSuccess(atomValue) && (
            <PiecesSection
              title="Drying"
              count={
                Object.values(atomValue.value).filter(
                  (piece) => piece.status === "drying",
                ).length
              }
              status="drying"
            >
              {Object.values(atomValue.value).map(
                ({ id, status }) =>
                  status === "drying" && (
                    <button onClick={() => deletePiece(id)} key={id}>
                      <Photo id={id}>
                        {(src) => (src ? <Piece imageUrl={src} /> : null)}
                      </Photo>
                    </button>
                  ),
              )}
            </PiecesSection>
          )}

          <PiecesSection title="Bisquing" count={0} status="bisquing">
            {null}
          </PiecesSection>

          <PiecesSection title="Glazed" count={0} status="glazed">
            {null}
          </PiecesSection>

          <PiecesSection title="Complete" count={0} status="complete">
            {null}
          </PiecesSection>
        </main>
      </div>
    </div>
  );
};
