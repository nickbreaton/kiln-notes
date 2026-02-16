import { Effect, Schema } from "effect";

export class ImageCompressionServiceError
  extends Schema.TaggedError<ImageCompressionServiceError>()("ImageCompressionServiceError", {
    cause: Schema.Unknown,
  })
{}

const OPTIMIZED_MAX_EDGE = 2560;
const OPTIMIZED_QUALITY = 0.86;
const THUMBNAIL_CSS_EDGE = 320;
const THUMBNAIL_DPR = 3;
const THUMBNAIL_QUALITY = 0.75;

const toWebpFileName = (name: string) => {
  const extensionIndex = name.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${name}.webp`;
  }
  return `${name.slice(0, extensionIndex)}.webp`;
};

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  Effect.tryPromise({
    try: () =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Could not encode thumbnail"));
            return;
          }

          resolve(blob);
        }, "image/webp", quality);
      }),
    catch: (cause) => new ImageCompressionServiceError({ cause }),
  });

const processImage = (file: File, maxEdge: number, quality: number) =>
  Effect.gen(function*() {
    const bitmap = yield* Effect.tryPromise({
      try: () => createImageBitmap(file),
      catch: (cause) => new ImageCompressionServiceError({ cause }),
    });

    const sourceMaxEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxEdge / sourceMaxEdge);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return yield* new ImageCompressionServiceError({
        cause: new Error("Could not create 2d context for canvas"),
      });
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = yield* toBlob(canvas, quality);

    return new File([blob], toWebpFileName(file.name), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  });

export class ImageCompressionService extends Effect.Service<ImageCompressionService>()("ImageCompressionService", {
  dependencies: [],
  effect: Effect.succeed({
    optimize: (file: File) => processImage(file, OPTIMIZED_MAX_EDGE, OPTIMIZED_QUALITY),
    createThumbnail: (file: File) => {
      const maxEdge = Math.round(THUMBNAIL_CSS_EDGE * THUMBNAIL_DPR);
      return processImage(file, maxEdge, THUMBNAIL_QUALITY);
    },
  }),
}) {}
