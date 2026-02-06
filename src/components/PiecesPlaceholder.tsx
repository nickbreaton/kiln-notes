export const PiecesPlaceholder = ({ text }: { text: string }) => {
  return (
    <div className="aspect-square">
      <div className="absolute left-0 right-0 border rounded h-full border-cream-200 bg-cream-100 grid place-items-center text-sm text-cream-400/80">
        No pieces {text}
      </div>
    </div>
  );
};
