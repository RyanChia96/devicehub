const rm = new Intl.NumberFormat("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** RM 5,499.00 / −RM 50.00 */
export function formatRM(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}RM ${rm.format(Math.abs(value))}`;
}
