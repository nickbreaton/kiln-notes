import { CircleAlert, X } from "lucide-react";

export function AuthErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="w-full bg-danger-light rounded-xl p-4 flex items-start gap-3">
      <CircleAlert className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-1">
        <span className="text-sm font-medium text-danger-500">Authentication Failed</span>
        <span className="text-sm text-danger-500/80">{message}</span>
      </div>
      <button onClick={onDismiss} className="p-1 hover:bg-danger-500/10 rounded cursor-pointer">
        <X className="w-4 h-4 text-danger-500" />
      </button>
    </div>
  );
}
