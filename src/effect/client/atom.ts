import { Atom } from "@effect-atom/atom-react";
import { Effect, Stream } from "effect";
import { PieceRepository } from "./PieceRepository";

const runtime = Atom.runtime(PieceRepository.Default);

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
