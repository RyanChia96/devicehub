import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BranchId } from "./branches";

const STORAGE_KEY = "dh-branch";

interface BranchContextValue {
  /** "" = all branches. Filters every screen and sets the POS counter's branch. */
  branch: BranchId;
  setBranch: (branch: BranchId) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

function readStored(): BranchId {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) ?? "") as BranchId;
  } catch {
    return "";
  }
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState<BranchId>(readStored);
  const setBranch = useCallback((next: BranchId) => {
    setBranchState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: keep it in memory only */
    }
  }, []);
  const value = useMemo(() => ({ branch, setBranch }), [branch, setBranch]);
  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside <BranchProvider>");
  return ctx;
}
