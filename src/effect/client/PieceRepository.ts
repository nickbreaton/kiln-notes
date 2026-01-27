import {
  DateTime,
  Effect,
  Option,
  Schema,
  Stream,
  SubscriptionRef,
} from "effect";
import { KeyValueStore } from "@effect/platform";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { Collection, Piece } from "../schema";
import { PhotoService } from "./PhotoService";

export class PieceRepository extends Effect.Service<PieceRepository>()(
  "PieceRepository",
  {
    dependencies: [
      BrowserKeyValueStore.layerLocalStorage,
      PhotoService.Default,
    ],
    effect: Effect.gen(function* () {
      const kv = yield* KeyValueStore.KeyValueStore;
      const store = kv.forSchema(Collection);
      const storeKey = "piecesCollection";
      const photoService = yield* PhotoService;
      const notifyRef = yield* SubscriptionRef.make(Symbol());
      const invalidate = SubscriptionRef.set(notifyRef, Symbol());

      if (!(yield* store.has(storeKey))) {
        yield* store.set(storeKey, {});
      }

      return {
        pieces: notifyRef.changes.pipe(
          Stream.flatMap(() => store.get(storeKey), { switch: true }),
          Stream.map((option) => (Option.isSome(option) ? option.value : {})),
        ),

        createPieces: (files: File[]) =>
          Effect.gen(function* () {
            // Plan
            // 1. Generate piece
            // 2. Adds image to service worker cache
            // 3. Merges into local storage state
            // 4. Invalidates local storage stream
            // 5. Upload to API (returns UUID) – ASYNC
            //    a. Saves to datastore
            //    b. Saves image to object store

            // ---

            for (const file of files) {
              const now = yield* DateTime.now;

              const piece = Piece.make({
                id: crypto.randomUUID(),
                status: "drying",
                statusUpdatedAt: now,
                updatedAt: now,
              });

              yield* store.modify(storeKey, (existing) => {
                return { [piece.id]: piece, ...existing };
              });

              yield* photoService.setCache(piece.id, file);
            }

            yield* invalidate;
          }),

        movePiece: (uuid: Schema.UUID) =>
          Effect.gen(function* () {
            // Plan
            // 1. Call API to update piece with new status and tiemstamp
            // 2. Invaliates local storage stream
          }),

        deletePiece: (id: string) =>
          Effect.gen(function* () {
            // Plan
            // 1. Call API to delete piece
            // 2. Invalidates local storage stream

            yield* photoService.delete(id);

            yield* store.modify(storeKey, (existing) => {
              const { [id]: _, ...rest } = existing;
              return rest;
            });

            yield* invalidate;
          }),
      };
    }),
  },
) {}
