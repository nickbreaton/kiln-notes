import { HttpApiMiddleware, HttpApp, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Config, Context, Effect, Layer, Redacted } from "effect";
import { getIronSession } from "iron-session";

export class Session extends Context.Tag("Session")<Session, Partial<{ userId: string }>>() {}

export class SessionMiddleware extends HttpApiMiddleware.Tag<SessionMiddleware>()("SessionMiddleware", {
  provides: Session,
}) {}

export const SessionMiddlewareLive = Layer.effect(
  SessionMiddleware,
  Effect.gen(function*() {
    const sessionSecret = yield* Config.redacted("SESSION_SECRET");

    // @effect-diagnostics-next-line returnEffectInGen:off -- outer effect for dependency gathering
    return Effect.gen(function*() {
      const currentRequest = yield* HttpServerRequest.HttpServerRequest.pipe(
        Effect.flatMap(HttpServerRequest.toWeb),
        Effect.orDie,
      );

      const placeholderResponse = new Response();

      const session = yield* Effect.promise(() =>
        getIronSession<typeof Session.Service>(currentRequest, placeholderResponse, {
          cookieName: "session",
          password: Redacted.value(sessionSecret),
          cookieOptions: { sameSite: "strict" },
        })
      );

      yield* HttpApp.appendPreResponseHandler((_, response) => {
        return Effect.gen(function*() {
          yield* Effect.promise(() => session.save());
          return yield* HttpServerResponse.setHeaders(response, placeholderResponse.headers);
        });
      });

      return Session.of(session);
    });
  }),
);
