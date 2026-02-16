import resize, { initResize } from "@jsquash/resize";
import resizeWasmUrl from "@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm?url";
import webpEncWasmUrl from "@jsquash/webp/codec/enc/webp_enc.wasm?url";
import webpEncSimdWasmUrl from "@jsquash/webp/codec/enc/webp_enc_simd.wasm?url";
import encodeWebp, { init as initWebpEncode } from "@jsquash/webp/encode";
import { Effect, Schema } from "effect";

export class ImageCompressionServiceError
  extends Schema.TaggedError<ImageCompressionServiceError>()("ImageCompressionServiceError", {
    cause: Schema.Unknown,
  })
{}

const OPTIMIZED_MAX_EDGE = 2560;
const OPTIMIZED_QUALITY = 86;
const WEBP_ENCODE_METHOD = 2;
const WEBP_THREAD_LEVEL = 1;

let codecsReadyPromise: Promise<void> | undefined;

const ensureCodecsReady = () =>
  Effect.tryPromise({
    try: async () => {
      if (!codecsReadyPromise) {
        codecsReadyPromise = (async () => {
          await initResize(resizeWasmUrl);
          await initWebpEncode({
            locateFile: (path: string) => {
              if (path.endsWith("webp_enc_simd.wasm")) {
                return webpEncSimdWasmUrl;
              }

              if (path.endsWith("webp_enc.wasm")) {
                return webpEncWasmUrl;
              }

              return path;
            },
          });
        })();
      }

      await codecsReadyPromise;
    },
    catch: (cause) => new ImageCompressionServiceError({ cause }),
  });

const toWebpFileName = (name: string) => {
  const extensionIndex = name.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${name}.webp`;
  }
  return `${name.slice(0, extensionIndex)}.webp`;
};

const decodeImageData = (file: File) =>
  Effect.tryPromise({
    try: async () => {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;

      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create 2d context for OffscreenCanvas");
      }

      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, width, height);
      bitmap.close();
      return imageData;
    },
    catch: (cause) => new ImageCompressionServiceError({ cause }),
  });

const resizeToMaxEdge = (imageData: ImageData, maxEdge: number) => {
  const currentMaxEdge = Math.max(imageData.width, imageData.height);

  if (currentMaxEdge <= maxEdge) {
    return Effect.succeed(imageData);
  }

  const scale = maxEdge / currentMaxEdge;
  const width = Math.max(1, Math.round(imageData.width * scale));
  const height = Math.max(1, Math.round(imageData.height * scale));

  return Effect.tryPromise({
    try: () => resize(imageData, { width, height, method: "catrom" }),
    catch: (cause) => new ImageCompressionServiceError({ cause }),
  });
};

const encodeAsWebpFile = (sourceFile: File, imageData: ImageData, quality: number) =>
  Effect.tryPromise({
    try: async () => {
      const buffer = await encodeWebp(imageData, {
        quality,
        method: WEBP_ENCODE_METHOD,
        thread_level: WEBP_THREAD_LEVEL,
      });
      return new File([buffer], toWebpFileName(sourceFile.name), {
        type: "image/webp",
        lastModified: sourceFile.lastModified,
      });
    },
    catch: (cause) => new ImageCompressionServiceError({ cause }),
  });

export class ImageCompressionService extends Effect.Service<ImageCompressionService>()("ImageCompressionService", {
  dependencies: [],
  effect: Effect.gen(function*() {
    yield* Effect.forkDaemon(ensureCodecsReady().pipe(Effect.ignore));

    return {
      optimize: (file: File) =>
        Effect.gen(function*() {
          yield* ensureCodecsReady();
          const decoded = yield* decodeImageData(file);
          const resized = yield* resizeToMaxEdge(decoded, OPTIMIZED_MAX_EDGE);
          return yield* encodeAsWebpFile(file, resized, OPTIMIZED_QUALITY);
        }),
    };
  }),
}) {}
