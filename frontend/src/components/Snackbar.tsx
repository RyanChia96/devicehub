import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface SnackbarMessage {
  id: number;
  text: string;
  action?: { label: string; onClick: () => void };
}

interface SnackbarContextValue {
  /** One snackbar at a time, bottom centre; hides itself after 6 seconds. */
  show: (text: string, action?: SnackbarMessage["action"]) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);
const HIDE_AFTER_MS = 6000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<SnackbarMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const hide = useCallback(() => setMessage(null), []);
  const show = useCallback<SnackbarContextValue["show"]>((text, action) => {
    setMessage({ id: Date.now(), text, action });
  }, []);

  useEffect(() => {
    if (!message) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(hide, HIDE_AFTER_MS);
    return () => window.clearTimeout(timer.current);
  }, [message, hide]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
        {message && (
          <div
            key={message.id}
            className="pointer-events-auto flex min-h-12 max-w-[560px] items-center gap-3 rounded-lg bg-foreground py-1.5 pr-1.5 pl-4 text-sm font-medium text-background shadow-modal motion-safe:animate-[snack-in_.22s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <span className="min-w-0 flex-1">{message.text}</span>
            {message.action && (
              <button
                type="button"
                className="h-8 rounded-full px-3 hover:bg-background/15"
                onClick={() => {
                  message.action?.onClick();
                  hide();
                }}
              >
                {message.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              className="grid size-8 place-items-center rounded-full hover:bg-background/15"
              onClick={hide}
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used inside <SnackbarProvider>");
  return ctx;
}
