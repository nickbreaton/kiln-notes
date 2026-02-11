import { Context } from "effect";

// TODO: use this to retrieve KV bindings
export class Locals extends Context.Tag("Locals")<
  Locals,
  { TODO_DURABLE_WORKER_HERE?: unknown; TODO_KV_HERE?: unknown }
>() {}
