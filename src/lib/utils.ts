import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedString(value: any, lang: "ar" | "en"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value[lang] || value.en || value.ar || "";
  }
  return String(value);
}
