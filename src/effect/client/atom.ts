import { Array, Console, Effect, Layer, Stream } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Atom from "effect/unstable/reactivity/Atom";
import { PieceId } from "../schema";
import { ClipboardService } from "./ClipboardService";
import { DocumentStore } from "./DocumentStore";
import { LocalImageService } from "./LocalImageService";
import { PieceRepository } from "./PieceRepository";
import { ServiceWorkerCacheService } from "./ServiceWorkerCacheService";
import { SyncManager } from "./SyncManager";
import { UserService } from "./UserService";
import { WebAuthnClientService } from "./WebAuthnClientService";

type LocalPiece = {
  id: PieceId;
  images: ReadonlyArray<{ id: string }>;
};

const runtime = Atom.runtime(() =>
  Layer.mergeAll(
    ClipboardService.layer,
    PieceRepository.layer,
    DocumentStore.layer,
    LocalImageService.layer,
    ServiceWorkerCacheService.layer,
    UserService.layer,
    SyncManager.layer,
    WebAuthnClientService.layer,
  ).pipe(Layer.provide(FetchHttpClient.layer))
);

export const userAtom = runtime.atom(() => {
  return Effect.gen(function*() {
    const service = yield* UserService;
    return service.user;
  }).pipe(Stream.unwrap);
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

export const pieceAtom = Atom.family((id: PieceId) => {
  return Atom.mapResult(
    collectionAtom,
    (pieces) => Array.findFirst(pieces as ReadonlyArray<LocalPiece>, (piece) => piece.id === id),
  );
});

export const getFullUrlAtom = Atom.family((id: PieceId) =>
  runtime.atom((context) => {
    return Effect.gen(function*() {
      const pieceResult = yield* context.result(pieceAtom(id));
      const { images } = (yield* pieceResult) as LocalPiece;
      const { id: imageId } = yield* Array.get(images, 0);
      return `/api/image/${imageId}/full`;
    });
  })
);

export const getThumbnailUrlAtom = Atom.family((id: PieceId) =>
  runtime.atom((context) => {
    return Effect.gen(function*() {
      const pieceResult = yield* context.result(pieceAtom(id));
      const { images } = (yield* pieceResult) as LocalPiece;
      const { id: imageId } = yield* Array.get(images, 0);
      return `/api/image/${imageId}/thumbnail`;
    });
  })
);

export const deletePieceAtom = runtime.fn((id: PieceId) => {
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
