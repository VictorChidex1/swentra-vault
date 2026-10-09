import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { FallbackProps } from "react-error-boundary";
import { AlertTriangleIcon, RefreshCwIcon, TerminalSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  level?: "global" | "page" | "widget";
}

function ErrorFallback({ error, resetErrorBoundary, level }: FallbackProps & { level: "global" | "page" | "widget" }) {
  if (level === "widget") {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 bg-destructive/5 rounded-xl h-full w-full text-center">
        <TerminalSquareIcon className="size-6 text-destructive mb-3" />
        <h3 className="text-sm font-mono tracking-widest text-destructive uppercase mb-1">Module Offline</h3>
        <p className="text-xs text-muted-foreground font-mono mb-4 line-clamp-2">{(error as Error).message}</p>
        <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="h-8 text-xs font-mono border-destructive/20 hover:bg-destructive/10 text-destructive">
          <RefreshCwIcon className="size-3 mr-2" /> Reboot
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-[#050505] p-6 text-center ${level === "global" ? "min-h-screen fixed inset-0 z-[9999]" : "min-h-[60vh] w-full rounded-2xl border border-destructive/10 bg-destructive/[0.02]"}`}>
      <div className="max-w-md w-full">
        <div className="size-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangleIcon className="size-8 text-destructive" />
        </div>
        
        <h1 className="text-xl md:text-2xl font-mono tracking-[0.2em] text-destructive uppercase mb-4">
          System Fault Detected
        </h1>
        
        <div className="bg-black/50 border border-white/5 rounded-lg p-4 mb-8 text-left overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <p className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
            <span className="size-2 bg-destructive rounded-full animate-pulse" />
            KERNEL_PANIC // EXCEPTION_CAUGHT
          </p>
          <p className="text-sm font-mono text-destructive/80 break-words font-medium">
            {(error as Error).message || "An unexpected critical error disrupted the execution thread."}
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={resetErrorBoundary}
          className="w-full font-mono tracking-widest bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <RefreshCwIcon className="size-4 mr-2" /> INITIATE REBOOT SEQUENCE
        </Button>
      </div>
    </div>
  );
}

export function SystemErrorBoundary({ children, level = "page" }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => <ErrorFallback {...props} level={level} />}
      onReset={() => {
        console.log(`[SYS] Rebooting boundary at level: ${level}`);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
