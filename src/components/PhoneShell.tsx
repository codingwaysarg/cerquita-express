import type { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40 flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-background flex flex-col md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:shadow-soft md:overflow-hidden">
        {children}
      </div>
    </div>
  );
}
