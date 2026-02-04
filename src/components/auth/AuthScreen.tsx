import type { ReactNode } from "react";

export function AuthScreen({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center pt-32 pb-48 mx-5">{children}</div>;
}
