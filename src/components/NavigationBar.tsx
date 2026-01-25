import { Plus } from "lucide-react";

export const NavigationBar = () => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-cream-200 bg-white px-5">
      <h1 className="text-xl font-semibold text-ink-900">Kiln Notes</h1>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-kiln-600 text-white"
        aria-label="Add piece"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  );
};
