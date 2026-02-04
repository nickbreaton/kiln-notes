export function NextStepsCard() {
  return (
    <div className="w-full bg-white rounded-xl border border-cream-200 p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-ink-900">Next Steps</h3>
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 bg-cream-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs text-ink-500">1</span>
        </div>
        <span className="text-sm text-ink-500">Copy the credential code above</span>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 bg-kiln-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs text-white">2</span>
        </div>
        <span className="text-sm text-ink-900 font-medium">Send it to your administrator</span>
      </div>
    </div>
  );
}
