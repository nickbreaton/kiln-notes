import { Schema } from "effect";

export const PieceIdBrand: unique symbol = Symbol.for("PieceId");
export const ImageIdBrand: unique symbol = Symbol.for("ImageId");
export const UserIdBrand: unique symbol = Symbol.for("UserId");

export const PieceId = Schema.UUID.pipe(Schema.brand(PieceIdBrand));
export const ImageId = Schema.UUID.pipe(Schema.brand(ImageIdBrand));
export const UserId = Schema.String.pipe(Schema.brand(UserIdBrand));

export type PieceId = typeof PieceId.Type;
export type ImageId = typeof ImageId.Type;
export type UserId = typeof UserId.Type;

export const Status = Schema.Literal(
  "drying",
  "bisquing",
  "glazed",
  "complete",
);

export const Image = Schema.Struct({
  id: ImageId,
  status: Status,
  createdAt: Schema.DateTimeUtc,
});

export const Piece = Schema.Struct({
  id: PieceId,
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
