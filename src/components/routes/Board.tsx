import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { useLocation } from "wouter";
import { collectionAtom, getThumbnailUrlAtom } from "../../effect/client/atom";
import { PieceId } from "../../effect/schema";
import { NavigationBar } from "../NavigationBar";
import { Piece } from "../Piece";
import { PiecesSection } from "../PiecesSection";

const Image = ({
  id,
  children,
}: {
  id: PieceId;
  children: (src?: string) => React.ReactNode;
}) => {
  const url = useAtomValue(getThumbnailUrlAtom(id));
  return children(AsyncResult.isSuccess(url) ? url.value : undefined);
};

export const Board = () => {
  const atomValue = useAtomValue(collectionAtom);
  const [, navigate] = useLocation();

  const pieces = AsyncResult.isSuccess(atomValue)
    ? atomValue.value
    : [];

  return (
    <>
      <NavigationBar />
      {AsyncResult.isSuccess(atomValue) && (
        <PiecesSection
          title="Drying"
          count={pieces.filter(
            (piece) => piece.status === "drying",
          ).length}
          status="drying"
        >
          {pieces.map(
            ({ id, status }) =>
              status === "drying" && (
                <button onClick={() => navigate(`/piece/${id}`)} key={id}>
                  <Image id={id}>
                    {(src) => (src ? <Piece imageUrl={src} /> : <div className="aspect-square" />)}
                  </Image>
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
