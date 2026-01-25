type PieceProps = {
  imageUrl: string;
  dayLabel?: string;
  muted?: boolean;
};

export const Piece = ({ imageUrl, dayLabel, muted }: PieceProps) => {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-xl bg-cream-100 ${
        muted ? "opacity-50" : "opacity-100"
      }`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {dayLabel ? (
        <div className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {dayLabel}
        </div>
      ) : null}
    </div>
  );
};
