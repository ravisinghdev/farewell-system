export interface PageSetting {
  enabled: boolean;
  reason: "maintenance" | "disabled" | "coming_soon";
  message?: string;
}

export type PageSettingsMap = Record<string, PageSetting>;

export const PAGE_KEYS = [
  "gallery",
  "chat",
  "contributions",
  "timeline",
  "tasks",
  "budget",
] as const;
