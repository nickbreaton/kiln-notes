import { Schema } from "effect";

export const Status = Schema.Literal(
  "drying",
  "bisquing",
  "glazed",
  "complete",
);

export const Image = Schema.Struct({
  id: Schema.UUID,
  status: Status,
  createdAt: Schema.DateTimeUtc,
});

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

  images: Schema.Array(Image),
});
