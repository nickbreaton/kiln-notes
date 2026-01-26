import { Schema } from "effect";

export const Status = Schema.Literal(
  "drying",
  "bisquing",
  "glazed",
  "complete",
);

export const Piece = Schema.Struct({
  id: Schema.UUID,
  status: Status,
  statusUpdatedAt: Schema.DateTimeUtc,
  serverSyncedAt: Schema.optional(Schema.DateTimeUtc),
});

export type Piece = typeof Piece.Encoded;

export const Collection = Schema.Record({
  key: Schema.UUID,
  value: Piece,
});

export type Collection = typeof Collection.Encoded;
