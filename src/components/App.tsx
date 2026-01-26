import { registerSW } from "virtual:pwa-register";
import { NavigationBar } from "./NavigationBar";
import { Piece } from "./Piece";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { PiecesSection } from "./PiecesSection";
import { collectionAtom } from "../effect/client/atom";

registerSW({ immediate: true });

export const App = () => {
  const dryingPieces = [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1637548580984-10c48d61b168?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTZ8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "2d",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1767188949805-d8f83eabf8b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTZ8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "5d",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1708368952731-db40e6a86d21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTd8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "1d",
    },
  ];

  const bisquingPieces = [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1564661637576-5e8123be07e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTd8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "3d",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1555885424-77ccf23eaafb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTh8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "1d",
    },
  ];

  const glazedPieces = [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1510035618584-c442b241abe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTh8&ixlib=rb-4.1.0&q=80&w=1080",
      dayLabel: "7d",
    },
  ];

  const completePieces = [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1703289627964-2f42da12eae1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTl8&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1652081489531-95f8b855bce3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjczOTl8&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1722960926430-1b4975af415c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjc0MDB8&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1503156958897-4c7b70dd4f5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjkzNjc0MDR8&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const atomValue = useAtomValue(collectionAtom);

  return (
    <div>
      <NavigationBar />
      <div className="mx-auto min-h-screen w-full max-w-97.5 bg-cream-50">
        <main className="flex flex-col gap-6 pb-8 pt-5">
          {/* tmp */}
          {Result.isSuccess(atomValue) &&
            Object.values(atomValue.value).map(({ id }) => (
              <img src={`/photo/${id}`} key={id} />
            ))}

          <PiecesSection
            title="Drying"
            count={dryingPieces.length}
            status="drying"
          >
            {dryingPieces.map((piece) => (
              <Piece
                key={piece.imageUrl}
                imageUrl={piece.imageUrl}
                dayLabel={piece.dayLabel}
              />
            ))}
          </PiecesSection>

          <PiecesSection
            title="Bisquing"
            count={bisquingPieces.length}
            status="bisquing"
          >
            {bisquingPieces.map((piece) => (
              <Piece
                key={piece.imageUrl}
                imageUrl={piece.imageUrl}
                dayLabel={piece.dayLabel}
              />
            ))}
          </PiecesSection>

          <PiecesSection
            title="Glazed"
            count={glazedPieces.length}
            status="glazed"
          >
            {glazedPieces.map((piece) => (
              <Piece
                key={piece.imageUrl}
                imageUrl={piece.imageUrl}
                dayLabel={piece.dayLabel}
              />
            ))}
          </PiecesSection>

          <PiecesSection
            title="Complete"
            count={completePieces.length}
            status="complete"
          >
            {completePieces.map((piece) => (
              <Piece key={piece.imageUrl} imageUrl={piece.imageUrl} />
            ))}
          </PiecesSection>
        </main>
      </div>
    </div>
  );
};
