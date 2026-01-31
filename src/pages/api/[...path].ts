import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpServer,
  FetchHttpClient,
} from "@effect/platform";
import { Effect, Layer } from "effect";
import { Schema } from "effect";
import type { APIRoute } from "astro";

// =============================================================================
// SHARED API DEFINITION (used by both server and client)
// =============================================================================

// Define schemas
class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.String,
  timestamp: Schema.String,
}) {}

// Define the API group (topLevel: true means no group prefix)
class ApiGroup extends HttpApiGroup.make("api", { topLevel: true }).add(
  HttpApiEndpoint.get("health", "/api/health").addSuccess(HealthResponse),
) {}

// Define the API
export class KilnApi extends HttpApi.make("kiln").add(ApiGroup) {}

// =============================================================================
// SERVER IMPLEMENTATION
// =============================================================================

// Create the group handlers layer (provides the actual endpoint implementations)
const ApiGroupLive = HttpApiBuilder.group(KilnApi, "api", (handlers) =>
  handlers.handle("health", () =>
    Effect.succeed(
      new HealthResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
    ),
  ),
);

// Create the API layer and provide the group implementations
const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(Layer.provide(ApiGroupLive));

// Merge with HttpServer.layerContext for toWebHandler
const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLayer, HttpServer.layerContext),
);

// =============================================================================
// ASTRO API ROUTE
// =============================================================================

// Server-rendered API route - no static paths needed
export const prerender = false;

// Handle all HTTP methods with the Effect router
export const ALL: APIRoute = async ({ request }) => handler(request);
