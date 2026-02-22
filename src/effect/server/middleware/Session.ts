import { Effect, Layer, ServiceMap } from "effect";
import { HttpApiMiddleware } from "effect/unstable/httpapi";
import { UserId } from "../../schema";

export interface SessionData {
  expectedChallenge: string;
  user: UserId;
}

export class Session extends ServiceMap.Service<Session, Partial<SessionData>>()("Session") {}

export class SessionMiddleware extends HttpApiMiddleware.Service<SessionMiddleware, {
  provides: Session;
}>()("SessionMiddleware") {}

const emptySession: Partial<SessionData> = {};

export const SessionMiddlewareLive = Layer.succeed(
  SessionMiddleware,
  ((httpEffect) => Effect.provideService(httpEffect, Session, emptySession)) as SessionMiddleware["Service"],
);
