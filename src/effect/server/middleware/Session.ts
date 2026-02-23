import { Config, Effect, Layer, Redacted, Schema, ServiceMap } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApiMiddleware } from "effect/unstable/httpapi";
import { getIronSession } from "iron-session";
import { UserId } from "../../schema";

export interface SessionData {
  expectedChallenge: string;
  user: UserId;
}

export class Session extends ServiceMap.Service<Session, Partial<SessionData>>()("Session") {}

export class SessionMiddleware extends HttpApiMiddleware.Service<SessionMiddleware, {
  provides: Session;
}>()("SessionMiddleware") {}

export const SessionMiddlewareLive = Layer.effect(
  SessionMiddleware,
  Effect.gen(function*() {
    const sessionSecret = yield* Config.redacted("SESSION_SECRET");

    return ((httpEffect, _options) =>
      Effect.gen(function*() {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const currentRequest = yield* HttpServerRequest.toWeb(request).pipe(Effect.orDie);

        const secure = yield* Schema.decodeEffect(Schema.URLFromString)(currentRequest.url).pipe(
          Effect.map((url) => url.protocol !== "http:"),
          Effect.orDie,
        );

        const placeholderResponse = new Response();

        const session = yield* Effect.promise(() =>
          getIronSession<Partial<SessionData>>(currentRequest, placeholderResponse, {
            cookieName: "session",
            password: Redacted.value(sessionSecret),
            cookieOptions: { sameSite: "strict", secure },
          })
        );

        const response = yield* Effect.provideService(httpEffect, Session, session);

        yield* Effect.promise(() => session.save());

        const withHeaders = HttpServerResponse.setHeaders(response, placeholderResponse.headers);

        if (session.user) {
          return yield* HttpServerResponse.setCookie(withHeaders, "user", session.user, {
            secure,
            maxAge: "365 days",
            path: "/",
          }).pipe(Effect.orDie);
        }

        return HttpServerResponse.removeCookie(withHeaders, "user");
      }));
  }),
);
