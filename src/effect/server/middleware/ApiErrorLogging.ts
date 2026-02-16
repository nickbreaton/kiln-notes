import { HttpApiBuilder, HttpApiSchema, HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { Cause, Effect, Option } from "effect";

const getStatusFromValue = (value: unknown): Option.Option<number> => {
  const ast = (value as { constructor?: { ast?: unknown } }).constructor?.ast;

  return ast === undefined
    ? Option.none()
    : Option.some(HttpApiSchema.getStatusErrorAST(ast as any));
};

const getStatusFromCause = (cause: Cause.Cause<unknown>): number => {
  const status = Cause.find(cause, (entry) => {
    if (Cause.isFailType(entry)) {
      return getStatusFromValue(entry.error);
    }

    if (Cause.isDieType(entry)) {
      return getStatusFromValue(entry.defect);
    }

    return Option.none();
  });

  return Option.getOrElse(status, () => 500);
};

export const ApiErrorLoggingMiddlewareLive = HttpApiBuilder.middleware(
  HttpMiddleware.make((httpApp) =>
    httpApp.pipe(
      Effect.tapErrorCause((cause) =>
        Effect.gen(function*() {
          const request = yield* HttpServerRequest.HttpServerRequest;

          yield* Effect.annotateLogs(Effect.logError("API request failed", cause), {
            "http.method": request.method,
            "http.status": getStatusFromCause(cause),
            "http.url": request.url,
          });
        })
      ),
    )
  )
);
