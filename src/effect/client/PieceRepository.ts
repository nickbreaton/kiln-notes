import { DateTime, Effect, Option, Schema, Stream } from "effect";
import { KeyValueStore } from "@effect/platform";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { Collection, Piece } from "../schema";

export class PieceRepository extends Effect.Service<PieceRepository>()(
  "PieceRepository",
  {
    dependencies: [BrowserKeyValueStore.layerLocalStorage],
    effect: Effect.gen(function* () {
      const kv = yield* KeyValueStore.KeyValueStore;
      const store = kv.forSchema(Collection);
      const storeKey = "piecesCollection";

      return {
        pieces: Stream.fromEffect(store.get(storeKey)).pipe(
          Stream.map((option) => (Option.isSome(option) ? option.value : {})),
        ),

        createPiece: (file: File) =>
          Effect.gen(function* () {
            // Master plan:
            // 1. Generate piece
            // 2. Adds image to service worker cache
            // 3. Merges into local storage state
            // 4. Invalidates local storage stream
            // 5. Upload to API (returns UUID) – ASYNC
            //    a. Saves to datastore
            //    b. Saves image to object store

            // ---

            const piece = Piece.make({
              id: crypto.randomUUID(),
              status: "drying",
              statusUpdatedAt: yield* DateTime.now, // is this even right?
            });

            yield* store.modify(storeKey, (existing) => {
              return { ...existing, [piece.id]: piece };
            });

            yield* Effect.promise(async () => {
              const keys = await caches.keys();

              for (const key of keys) {
                const cache = await caches.open(key);
                await cache.put("/photo/" + piece.id, new Response(file));
              }
            });
          }),

        movePiece: (uuid: Schema.UUID) =>
          Effect.gen(function* () {
            // 1. Call API to update piece with new status and tiemstamp
            // 2. Invaliates local storage stream
          }),

        deletePiece: (uuid: Schema.UUID) =>
          Effect.gen(function* () {
            // 1. Call API to delete piece
            // 2. Invalidates local storage stream
          }),
      };
    }),
  },
) {}
