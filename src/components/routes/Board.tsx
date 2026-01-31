import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { PiecesSection } from "../PiecesSection";
import {
  collectionAtom,
  deletePieceAtom,
  getPhotoUrlAtom,
} from "../../effect/client/atom";
import { Piece } from "../Piece";
import { useLocation } from "wouter";

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
  // const deletePiece = useAtomSet(deletePieceAtom);
  const [, navigate] = useLocation();

  return (
    <>
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
                <button onClick={() => navigate(`/piece/${id}`)} key={id}>
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
    </>
  );
};
