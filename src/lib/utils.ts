import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Round XMR amount UP to 12 decimal places (piconero precision).
 * This ensures users always send enough XMR to cover the deposit.
 */
export function roundUpXmr(amount: number, decimals: number = 12): string {
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.ceil(amount * multiplier) / multiplier;
  return rounded.toFixed(decimals);
}
