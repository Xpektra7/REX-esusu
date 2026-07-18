import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LOCALE } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number, fractionDigits = 0): string {
  return (kobo / 100).toLocaleString(LOCALE, {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: fractionDigits,
  });
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
  });
}

export function formatDate(
  dateStr: string,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  return new Date(dateStr).toLocaleDateString(LOCALE, opts);
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(LOCALE);
}

export function getGreeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Hi, ${name}`;
  if (h < 17) return `Hello, ${name}`;
  return `Hey, ${name}`;
}

export function rotationLabel(
  currentCycle: number,
  totalCycles: number | null,
  memberCount: number,
): { rotation: number; totalRotations: number | null; round: number } {
  const totalRotations = totalCycles === null ? null : Math.ceil(totalCycles / memberCount);
  const rotation = Math.ceil(currentCycle / memberCount);
  const round = ((currentCycle - 1) % memberCount) + 1;
  return { rotation, totalRotations, round };
}
