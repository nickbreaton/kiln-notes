import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

export class ApiErrorLoggingMiddleware extends HttpApiMiddleware.Service<ApiErrorLoggingMiddleware>()(
  "ApiErrorLoggingMiddleware",
) {}

export const ApiErrorLoggingMiddlewareLive = Layer.succeed(
  ApiErrorLoggingMiddleware,
  (httpEffect) =>
    httpEffect.pipe(
      Effect.tapCause((cause) =>
        Effect.gen(function*() {
          const request = yield* HttpServerRequest.HttpServerRequest;

          yield* Effect.annotateLogs(Effect.logError("API request failed", cause), {
            "http.method": request.method,
            "http.url": request.url,
          });
        })
      ),
    ),
);
