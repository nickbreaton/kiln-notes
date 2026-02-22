import { HttpApiMiddleware, HttpApp, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Config, Effect, Layer, Redacted, Schema, ServiceMap } from "effect";
import { getIronSession } from "iron-session";
import { UserId } from "../../schema";

/**
 * This data can be trusted as its cryptographically secured,
 * take care when writing to it.
 */
export interface SessionData {
  expectedChallenge: string;
  user: UserId;
}

/**
 * @effect-leakable-service
 */
export class Session extends ServiceMap.Service<Session, Partial<SessionData>>()("Session") {}

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

      const secure = yield* Schema.decode(Schema.URL)(currentRequest.url).pipe(
        Effect.andThen(url => url.protocol !== "http:"),
        Effect.orDie,
      );

      const placeholderResponse = new Response();

      const session = yield* Effect.promise(() =>
        getIronSession<typeof Session.Service>(currentRequest, placeholderResponse, {
          cookieName: "session",
          password: Redacted.value(sessionSecret),
          cookieOptions: { sameSite: "strict", secure },
        })
      );

      yield* HttpApp.appendPreResponseHandler((_, response) => {
        return Effect.gen(function*() {
          const applyUserCookie = session.user
            ? HttpServerResponse.setCookie("user", session.user, { secure, maxAge: "365 days", path: "/" })
            : HttpServerResponse.removeCookie("user");

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
