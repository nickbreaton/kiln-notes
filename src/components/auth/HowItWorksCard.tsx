import { Info } from "lucide-react";

export function HowItWorksCard() {
  return (
    <div className="w-full bg-white rounded-2xl border border-cream-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Info className="w-5 h-5 text-kiln-600" />
        <span className="text-base font-medium text-ink-900">How it works</span>
      </div>
      <p className="text-sm text-ink-500">
        Create a passkey on this device. You’ll receive a credential code to share with your administrator, which will
        grant you access to track your pottery progress.
      </p>
    </div>
  );
}
