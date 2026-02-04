import { Flame } from "lucide-react";

export function AuthHero({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 bg-kiln-600 rounded-2xl flex items-center justify-center">
        <Flame className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-ink-900">Kiln Notes</h1>
      <p className="text-base text-ink-500">{subtitle}</p>
    </div>
  );
}
