import { HttpApiMiddleware, HttpApp, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Config, Context, Duration, Effect, Layer, Redacted } from "effect";
import { getIronSession } from "iron-session";

/**
 * This data can be trusted as its cryptographically secured,
 * take care when writing to it.
 */
export interface SessionData {
  expectedChallenge: string;
  user: string;
}

/**
 * @effect-leakable-service
 */
export class Session extends Context.Tag("Session")<
  Session,
  Partial<SessionData>
>() {}

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

      const applyUserCookie = session.user
        ? HttpServerResponse.setCookie("user", session.user, { secure: true, maxAge: Duration.days(365), path: "/" })
        : HttpServerResponse.removeCookie("user");

      yield* HttpApp.appendPreResponseHandler((_, response) => {
        return Effect.gen(function*() {
          // Save session just before response
          yield* Effect.promise(() => session.save());

          return yield* response.pipe(
            HttpServerResponse.setHeaders(placeholderResponse.headers),
            Effect.flatMap(applyUserCookie),
            Effect.orDie,
          );
        });
      });

      return Session.of(session);
    });
  }),
);
