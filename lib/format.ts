/**
 * Format a number as Indian Rupees (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "5m 30s" or "2h 5m")
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return "0s";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Format a date string or object to a standard display format
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Dec 28, 2024")
 */
export function formatDate(date: string | Date): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get initials from a full name
 * @param name - Full name of the person
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name || name.trim() === "") return "?";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}










































