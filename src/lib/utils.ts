import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names, letting a later Tailwind utility win over an earlier one.
 *
 * The UI components were written against the AXXES portal's kit and came across
 * wholesale, so they depend on this resolving conflicts the same way: without
 * twMerge a component's own `className` prop silently loses to its defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

/**
 * Money, in minor units.
 *
 * The collection engine stores every currency amount as an integer of cents (see
 * schema/collection.ts), so nothing here ever sees a float. A float is not a
 * currency and insurance values get summed.
 */
export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
