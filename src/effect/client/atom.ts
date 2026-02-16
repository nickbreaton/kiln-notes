import { Atom } from "@effect-atom/atom-react";
import { FetchHttpClient } from "@effect/platform";
import { Array, Console, Effect, Layer, Option, Schema, Stream } from "effect";
import { SyncService } from "../server/SyncService";
import { ClipboardService } from "./ClipboardService";
import { DocumentStore } from "./DocumentStore";
import { LocalImageService } from "./LocalImageService";
import { PieceRepository } from "./PieceRepository";
import { ServiceWorkerCacheService } from "./ServiceWorkerCacheService";
import { SyncManager } from "./SyncManager";
import { UserService } from "./UserService";
import { WebAuthnClientService } from "./WebAuthnClientService";

const runtime = Atom.runtime(
  Layer.mergeAll(
    ClipboardService.Default,
    PieceRepository.Default,
    DocumentStore.Default,
    LocalImageService.Default,
    ServiceWorkerCacheService.Default,
    UserService.Default,
    SyncManager.Default,
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

export const pieceAtom = Atom.family((id: string) => {
  return Atom.mapResult(collectionAtom, Array.findFirst((piece) => piece.id === id));
});

export const getImageUrlAtom = Atom.family((id: string) =>
  runtime.atom((context) => {
    return Effect.gen(function*() {
      const localImages = yield* LocalImageService;
      const pieceResult = yield* context.result(pieceAtom(id));
      const { images } = yield* pieceResult;
      const { id: imageId } = yield* Array.get(images, 0);
      return `/api/image/${imageId}`;
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
