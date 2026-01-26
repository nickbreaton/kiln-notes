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

  /**
   * When the status was last updated, user needs to know how long ago it was.
   */
  statusUpdatedAt: Schema.DateTimeUtc,

  /**
   * The last time the piece was updated.
   */
  updatedAt: Schema.DateTimeUtc,

  /**
   * This should ideally match the updatedAt field, otherwise a sync is needed.
   */
  serverSyncedAt: Schema.optional(Schema.DateTimeUtc),

  photoUploadedAt: Schema.optional(Schema.DateTimeUtc),
});

export type Piece = typeof Piece.Encoded;

export const Collection = Schema.Record({
  key: Schema.UUID,
  value: Piece,
});

export type Collection = typeof Collection.Encoded;
