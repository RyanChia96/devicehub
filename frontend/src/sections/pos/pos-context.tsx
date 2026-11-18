import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { itemName, lookupCode } from "@/api/catalog";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import type { CatalogItem } from "@/lib/demo-data";
import { formatRM } from "@/lib/money";

export type PosStep = "cart" | "pay" | "done";
export type ReceiptType = "einv" | "cash";
export type PayMethod = "Cash" | "Card" | "DuitNow QR" | "E-wallet" | "Bank transfer" | "Instalment";

export interface CartLine {
  key: string;
  item: CatalogItem;
  qty: number;
  /** RM off this line (devices only). */
  discount: number;
}

export interface Buyer {
  name: string;
  idType: "NRIC" | "BRN" | "PASSPORT" | "ARMY";
  idNo: string;
  tin: string;
  address: string;
  email: string;
  phone: string;
  sst: string;
}

export interface Notice {
  tone: "info" | "warning" | "error";
  title: string;
  body?: string;
}

export interface CompletedSale {
  number: string;
  total: number;
  method: PayMethod;
  change: number;
  receipt: ReceiptType;
}

interface PosState {
  open: boolean;
  step: PosStep;
  lines: CartLine[];
  notice: Notice | null;
  receipt: ReceiptType;
  buyer: Buyer;
  method: PayMethod | null;
  cashReceived: number | null;
  lastSale: CompletedSale | null;
  seq: number;
}

const EMPTY_BUYER: Buyer = { name: "", idType: "NRIC", idNo: "", tin: "", address: "", email: "", phone: "", sst: "" };

const initialState: PosState = {
  open: false,
  step: "cart",
  lines: [],
  notice: null,
  receipt: "einv",
  buyer: EMPTY_BUYER,
  method: null,
  cashReceived: null,
  lastSale: null,
  seq: 214,
};

type Action =
  | { type: "open" }
  | { type: "close" }
  | { type: "notice"; notice: Notice | null }
  | { type: "add"; item: CatalogItem }
  | { type: "remove"; key: string }
  | { type: "qty"; key: string; delta: number }
  | { type: "discount"; key: string; amount: number }
  | { type: "receipt"; receipt: ReceiptType }
  | { type: "buyer"; patch: Partial<Buyer> }
  | { type: "step"; step: PosStep }
  | { type: "method"; method: PayMethod }
  | { type: "cash"; amount: number }
  | { type: "complete"; sale: CompletedSale }
  | { type: "newSale" };

function reducer(state: PosState, action: Action): PosState {
  switch (action.type) {
    case "open":
      return { ...state, open: true };
    case "close":
      return state.step === "done"
        ? { ...initialState, seq: state.seq, lastSale: state.lastSale }
        : { ...state, open: false, notice: null };
    case "notice":
      return { ...state, notice: action.notice };
    case "add": {
      const existing = state.lines.find((l) => l.item.kind === "accessory" && l.item.id === action.item.id);
      if (existing) {
        return {
          ...state,
          notice: null,
          lines: state.lines.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l)),
        };
      }
      return {
        ...state,
        step: state.step === "done" ? "cart" : state.step,
        notice: null,
        lines: [...state.lines, { key: `${action.item.id}-${Date.now()}`, item: action.item, qty: 1, discount: 0 }],
      };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.key !== action.key) };
    case "qty":
      return {
        ...state,
        lines: state.lines
          .map((l) => (l.key === action.key ? { ...l, qty: l.qty + action.delta } : l))
          .filter((l) => l.qty > 0),
      };
    case "discount":
      return { ...state, lines: state.lines.map((l) => (l.key === action.key ? { ...l, discount: action.amount } : l)) };
    case "receipt":
      return { ...state, receipt: action.receipt };
    case "buyer":
      return { ...state, buyer: { ...state.buyer, ...action.patch } };
    case "step":
      return { ...state, step: action.step };
    case "method":
      return { ...state, method: action.method, cashReceived: null };
    case "cash":
      return { ...state, cashReceived: action.amount };
    case "complete":
      return { ...state, step: "done", lastSale: action.sale, seq: state.seq + 1 };
    case "newSale":
      return { ...initialState, open: true, seq: state.seq };
  }
}

export interface PosTotals {
  subtotal: number;
  discount: number;
  total: number;
  cashBillOnly: string[];
  /** Over RM 10,000: LHDN needs an individual e-invoice. */
  overLimit: boolean;
}

export function totalsOf(lines: CartLine[]): PosTotals {
  const subtotal = lines.reduce((a, l) => a + l.item.price * l.qty, 0);
  const discount = lines.reduce((a, l) => a + l.discount, 0);
  const total = subtotal - discount;
  const cashBillOnly = lines
    .filter((l) => l.item.kind === "device" && l.item.cashBillOnly)
    .map((l) => itemName(l.item));
  return { subtotal, discount, total, cashBillOnly, overLimit: total > 10000 };
}

/** Which receipt the sale will actually get, and why. */
export function receiptRule(state: Pick<PosState, "receipt">, totals: PosTotals) {
  const hasCbo = totals.cashBillOnly.length > 0;
  const blocked = totals.overLimit && hasCbo;
  const effective: ReceiptType = totals.overLimit ? "einv" : hasCbo ? "cash" : state.receipt;
  return { effective, blocked, einvLocked: hasCbo, cashLocked: totals.overLimit };
}

export function missingBuyerFields(b: Buyer): string[] {
  const miss: string[] = [];
  if (!b.name.trim()) miss.push("name");
  if (!b.idNo.trim()) miss.push("ID no.");
  if (!b.tin.trim()) miss.push("TIN");
  if (!b.address.trim()) miss.push("address");
  if (!b.email.trim() && !b.phone.trim()) miss.push("email or phone");
  return miss;
}

interface PosContextValue {
  state: PosState;
  totals: PosTotals;
  /** Branch the counter sells from: the switcher's branch, or KL Sungai Wang for "All branches". */
  counterBranch: string;
  open: () => void;
  close: () => void;
  openWithCode: (code: string) => void;
  addCode: (code: string) => Promise<void>;
  dispatch: React.Dispatch<Action>;
}

const PosContext = createContext<PosContextValue | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { branch } = useBranch();
  const counterBranchId = branch || "KLSW";
  const totals = useMemo(() => totalsOf(state.lines), [state.lines]);

  const addCode = useCallback(
    async (code: string) => {
      const found = await lookupCode(code);
      if (!found.ok) {
        const notice: Notice =
          found.reason === "bad-imei-length"
            ? { tone: "error", title: "IMEI must be 15 digits", body: `You entered ${found.code.length} digits. Scan again, or type the IMEI from the box label.` }
            : found.reason === "bad-check-digit"
              ? { tone: "error", title: "This IMEI fails the check digit", body: `${found.code} is not a valid IMEI. Compare it with the label on the box.` }
              : { tone: "warning", title: `Nothing matches "${found.code}"`, body: "Try the IMEI, serial number, model name or SKU." };
        dispatch({ type: "notice", notice });
        return;
      }
      const item = found.item;
      if (item.kind === "device") {
        const name = itemName(item);
        if (state.lines.some((l) => l.item.id === item.id)) {
          dispatch({ type: "notice", notice: { tone: "info", title: `${name} is already in the cart` } });
          return;
        }
        if (item.status === "Sold") {
          dispatch({ type: "notice", notice: { tone: "error", title: `${name} is already sold`, body: "Check the IMEI against the box." } });
          return;
        }
        if (item.status === "Repairing") {
          dispatch({ type: "notice", notice: { tone: "warning", title: `${name} is being repaired`, body: "It can be sold once a technician marks it Available." } });
          return;
        }
        if (item.branch !== counterBranchId) {
          dispatch({ type: "notice", notice: { tone: "info", title: `${name} is at ${branchName(item.branch)}`, body: "Transfer it to this branch before selling it." } });
          return;
        }
      } else {
        const inCart = state.lines.filter((l) => l.item.id === item.id).reduce((a, l) => a + l.qty, 0);
        if (item.qty === 0) {
          dispatch({ type: "notice", notice: { tone: "error", title: `${item.name} is out of stock`, body: `Price ${formatRM(item.price)}. None left at this branch.` } });
          return;
        }
        if (inCart >= item.qty) {
          dispatch({ type: "notice", notice: { tone: "warning", title: `All ${item.qty} are already in the cart` } });
          return;
        }
      }
      dispatch({ type: "add", item });
    },
    [state.lines, counterBranchId],
  );

  const value = useMemo<PosContextValue>(
    () => ({
      state,
      totals,
      counterBranch: branchName(counterBranchId),
      open: () => dispatch({ type: "open" }),
      close: () => dispatch({ type: "close" }),
      openWithCode: (code: string) => {
        dispatch({ type: "open" });
        if (state.step === "done") dispatch({ type: "newSale" });
        void addCode(code);
      },
      addCode,
      dispatch,
    }),
    [state, totals, counterBranchId, addCode],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosContextValue {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos must be used inside <PosProvider>");
  return ctx;
}
