import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { useLocation } from "wouter";
import { collectionAtom, deletePieceAtom, getPhotoUrlAtom } from "../../effect/client/atom";
import { NavigationBar } from "../NavigationBar";
import { Piece } from "../Piece";
import { PiecesSection } from "../PiecesSection";

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

export const Board = () => {
  const atomValue = useAtomValue(collectionAtom);
  const [, navigate] = useLocation();

  return (
    <>
      <NavigationBar />
      {Result.isSuccess(atomValue) && (
        <PiecesSection
          title="Drying"
          count={atomValue.value.filter(
            (piece) => piece.status === "drying",
          ).length}
          status="drying"
        >
          {atomValue.value.map(
            ({ id, status }) =>
              status === "drying" && (
                <button onClick={() => navigate(`/piece/${id}`)} key={id}>
                  <Photo id={id}>
                    {(src) => (src ? <Piece imageUrl={src} /> : <div className="aspect-square" />)}
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
    </>
  );
};
