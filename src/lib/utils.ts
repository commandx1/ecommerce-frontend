import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True only for absolute http(s) URLs — the only thing next/image can be handed safely. */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}
