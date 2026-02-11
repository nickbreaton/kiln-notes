import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { handle } from "@astrojs/cloudflare/handler";
import { DurableObject } from "cloudflare:workers";

export class UserDocumentDurableObject extends DurableObject<Env> {
  async get(): Promise<string | null> {
    const value = await this.ctx.storage.get<string>("data");
    return value ?? null;
  }

  async set(value: string): Promise<void> {
    await this.ctx.storage.put("data", value);
  }
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  return {
    default: {
      async fetch(request, env, ctx) {
        return handle(manifest, app, request, env, ctx);
      },
    } satisfies ExportedHandler<Env>,
    UserDocumentDurableObject,
  };
}
