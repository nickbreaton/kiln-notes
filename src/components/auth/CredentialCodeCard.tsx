import { Check, Copy } from "lucide-react";

export function CredentialCodeCard({
  code,
  copied,
  onCopy,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="w-full bg-white rounded-xl border border-cream-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500 tracking-wide">Credential code</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 bg-cream-100 rounded-md px-2 py-1 active:bg-cream-200 cursor-pointer"
        >
          <span className="text-xs text-ink-500">{copied ? "Copied" : "Copy"}</span>
          {copied ? <Check className="w-3 h-3 text-ink-500" /> : <Copy className="w-3 h-3 text-ink-500" />}
        </button>
      </div>
      <textarea
        readOnly
        value={code}
        rows={5}
        className="bg-cream-100 rounded-lg p-3 text-xs text-ink-500 resize-none w-full focus:outline-none"
      />
    </div>
  );
}
