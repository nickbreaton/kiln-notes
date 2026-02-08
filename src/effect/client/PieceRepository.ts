import { KeyValueStore } from "@effect/platform";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { DateTime, Effect, Option, Schema, Stream, SubscriptionRef } from "effect";
import * as Y from "yjs";
import { Piece } from "../schema";
import { PhotoService } from "./PhotoService";

export class PieceRepository extends Effect.Service<PieceRepository>()(
  "PieceRepository",
  {
    dependencies: [
      PhotoService.Default,
    ],
    effect: Effect.gen(function*() {
      const doc = new Y.Doc();
      const map = doc.getMap<typeof Piece.Type>("piecesCollection");

      const photoService = yield* PhotoService;

      return {
        pieces: Stream.async<typeof Piece.Type[]>((emit) => {
          const callback = () => {
            emit.single(Array.from(map.values()));
          };

          callback();

          map.observe(callback);

          return Effect.sync(() => {
            map.unobserve(callback);
          });
        }),

        createPieces: (files: File[]) =>
          Effect.gen(function*() {
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

              yield* photoService.setCache(piece.id, file);

              map.set(piece.id, piece);
            }
          }),

        movePiece: (uuid: Schema.UUID) =>
          Effect.gen(function*() {
            // Plan
            // 1. Call API to update piece with new status and tiemstamp
            // 2. Invaliates local storage stream
          }),

        deletePiece: (id: string) =>
          Effect.gen(function*() {
            // Plan
            // 1. Call API to delete piece
            // 2. Invalidates local storage stream

            yield* photoService.delete(id);

            map.delete(id);
          }),
      };
    }),
  },
) {}
