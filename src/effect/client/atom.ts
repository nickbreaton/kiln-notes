import { Atom } from "@effect-atom/atom-react";
import { Effect, Layer, Stream } from "effect";
import { PieceRepository } from "./PieceRepository";
import { PhotoService } from "./PhotoService";

const runtime = Atom.runtime(
  Layer.mergeAll(PieceRepository.Default, PhotoService.Default),
);

export const collectionAtom = runtime.atom(() => {
  return Effect.gen(function* () {
    const repo = yield* PieceRepository;
    return repo.pieces;
  }).pipe(Stream.unwrap);
});

export const createPieceAtom = runtime.fn((file: File) => {
  return Effect.gen(function* () {
    const repo = yield* PieceRepository;
    yield* repo.createPiece(file);
  });
});

export const getPhotoUrlAtom = Atom.family((id: string) =>
  runtime.atom((context) => {
    return Effect.gen(function* () {
      const service = yield* PhotoService;
      const blob = yield* service.get(id);
      const url = URL.createObjectURL(blob);
      context.addFinalizer(() => URL.revokeObjectURL(url));
      return url;
    });
  }),
);
