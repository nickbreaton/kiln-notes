import { Context } from "effect";
import type { UserDocumentDurableObject } from "../../../cloudflare";

export class CloudflareBindings extends Context.Tag("CloudflareBindings")<
  CloudflareBindings,
  { USER_DOCUMENTS: DurableObjectNamespace<UserDocumentDurableObject> }
>() {}
