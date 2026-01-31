import {
  HttpApp,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { Effect } from "effect";
import type { APIRoute } from "astro";

// Server-rendered API route - no static paths needed
export const prerender = false;

// Create the Effect HTTP router with just health endpoint
const router = HttpRouter.empty.pipe(
  // Health check endpoint
  HttpRouter.get(
    "/api/health",
    Effect.gen(function* () {
      return yield* HttpServerResponse.text("ok");
    }),
  ),

  // Catch-all for unmatched routes
  HttpRouter.all(
    "*",
    Effect.gen(function* () {
      const req = yield* HttpServerRequest.HttpServerRequest;
      return yield* HttpServerResponse.json(
        {
          error: "Not Found",
          path: req.url,
          method: req.method,
        },
        { status: 404 },
      );
    }),
  ),
);

// Convert router to web handler that can process Request objects
const handler = HttpApp.toWebHandler(router);

// Handle all HTTP methods with the Effect router
export const ALL: APIRoute = async ({ request }) => handler(request);
