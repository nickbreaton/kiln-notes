import { Plus } from "lucide-react";

export const NavigationBar = () => {
  return (
    <div className="h-14">
      <header className="fixed top-0 left-0 right-0 z-10 border-b border-cream-200 bg-white h-14 flex items-center">
        <div className="w-full mx-auto max-w-97.5 justify-between px-5 flex items-center">
          <h1 className="text-xl font-semibold text-ink-900">Kiln Notes</h1>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-kiln-600 text-white"
            aria-label="Add piece"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>
    </div>
  );
};
