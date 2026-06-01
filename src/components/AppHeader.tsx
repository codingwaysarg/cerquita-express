import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export function AppHeader({
  title,
  back = false,
  right,
}: {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="flex items-center gap-2 px-4 h-14">
        {back ? (
          <button
            aria-label="Volver"
            onClick={() => router.history.back()}
            className="size-11 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-card" />
            <span className="font-semibold tracking-tight">Cerquita</span>
          </div>
        )}
        {title && <h1 className="flex-1 text-center font-semibold pr-8">{title}</h1>}
        {!title && <div className="flex-1" />}
        <div className="min-w-8 flex justify-end">{right}</div>
      </div>
    </header>
  );
}
