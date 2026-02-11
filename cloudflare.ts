import { handle } from "@astrojs/cloudflare/handler";
import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { DurableObject } from "cloudflare:workers";

export class UserDocumentDurableObject extends DurableObject {
  async get(): Promise<string | null> {
    const value = await this.ctx.storage.get<string>("data");
    return value ?? null;
  }

  /** TODO: add an update – I think this is needed for transaction-like changes */

  async set(value: string): Promise<void> {
    await this.ctx.storage.put("data", value);
  }
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  const fetch = (request: any, env: any, ctx: any) => {
    return handle(manifest, app, request, env, ctx);
  };

  return {
    default: { fetch },
    UserDocumentDurableObject,
  };
}
