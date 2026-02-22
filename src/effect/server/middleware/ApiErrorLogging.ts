import { Layer } from "effect";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

export class ApiErrorLoggingMiddleware extends HttpApiMiddleware.Service<ApiErrorLoggingMiddleware>()(
  "ApiErrorLoggingMiddleware",
) {}

export const ApiErrorLoggingMiddlewareLive = Layer.succeed(
  ApiErrorLoggingMiddleware,
  ((httpEffect) => httpEffect) as ApiErrorLoggingMiddleware["Service"],
);
