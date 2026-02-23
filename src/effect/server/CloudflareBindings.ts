import type { R2Bucket } from "@cloudflare/workers-types";
import { ServiceMap } from "effect";
import type { UserDocumentDurableObject } from "../../../cloudflare";

export class CloudflareBindings extends ServiceMap.Service<CloudflareBindings, {
  USER_DOCUMENTS: DurableObjectNamespace<UserDocumentDurableObject>;
  IMAGES_BUCKET: R2Bucket;
}>()("CloudflareBindings") {}
