import type { R2Bucket } from "@cloudflare/workers-types";
import { Context } from "effect";
import type { UserDocumentDurableObject } from "../../../cloudflare";

export class CloudflareBindings extends Context.Tag("CloudflareBindings")<
  CloudflareBindings,
  { USER_DOCUMENTS: DurableObjectNamespace<UserDocumentDurableObject>; IMAGES_BUCKET: R2Bucket }
>() {}
