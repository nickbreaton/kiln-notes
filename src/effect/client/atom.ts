import { Atom } from "@effect-atom/atom-react";
import { FetchHttpClient } from "@effect/platform";
import { Console, Effect, Layer, Schema, Stream } from "effect";
import { ClipboardService } from "./ClipboardService";
import { DocumentStore } from "./DocumentStore";
import { PhotoService } from "./PhotoService";
import { PieceRepository } from "./PieceRepository";
import { UserService } from "./UserService";
import { WebAuthnClientService } from "./WebAuthnClientService";

const runtime = Atom.runtime(
  Layer.mergeAll(
    ClipboardService.Default,
    PieceRepository.Default,
    DocumentStore.Default,
    PhotoService.Default,
    UserService.Default,
    Layer.provide(WebAuthnClientService.Default, FetchHttpClient.layer),
  ),
);

export const userAtom = runtime.atom(() => {
  return UserService.pipe(Effect.andThen(service => service.user), Stream.unwrap);
});

export const collectionAtom = runtime.atom(() => {
  return Effect.gen(function*() {
    const repo = yield* PieceRepository;
    return repo.pieces;
  }).pipe(
    Stream.unwrap,
    Stream.tap(Console.log),
  );
});

export const createPiecesAtom = runtime.fn((files: File[]) => {
  return Effect.gen(function*() {
    const repo = yield* PieceRepository;
    yield* repo.createPieces(files);
  });
});

export const getPhotoUrlAtom = Atom.family((id: string) =>
  runtime.atom((context) => {
    return Effect.gen(function*() {
      const service = yield* PhotoService;
      const blob = yield* service.get(id);
      const url = URL.createObjectURL(blob);
      context.addFinalizer(() => URL.revokeObjectURL(url));
      return url;
    });
  })
);

export const deletePieceAtom = runtime.fn((id: string) => {
  return Effect.gen(function*() {
    const repo = yield* PieceRepository;
    yield* repo.deletePiece(id);
  });
});

export const registerPasskeyAtom = runtime.fn(() =>
  Effect.gen(function*() {
    const webAuthn = yield* WebAuthnClientService;
    return yield* webAuthn.register;
  })
);

export const authenticatePasskeyAtom = runtime.fn(() =>
  Effect.gen(function*() {
    const webAuthn = yield* WebAuthnClientService;
    return yield* webAuthn.authenticate;
  })
);

export const copiedAtom = runtime.atom(() =>
  Effect.gen(function*() {
    const clipboard = yield* ClipboardService;
    return clipboard.copied;
  }).pipe(Stream.unwrap)
);

export const copyToClipboardAtom = runtime.fn((text: string) =>
  Effect.gen(function*() {
    const clipboard = yield* ClipboardService;
    yield* clipboard.copy(text);
  })
);
