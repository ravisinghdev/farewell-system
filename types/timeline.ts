// types/timeline.ts
import { Performance } from "./performance";

export type TimelineBlockType =
  | "performance"
  | "buffer"
  | "announcement"
  | "break";

export interface TimelineBlock {
  id: string;
  farewell_id: string;
  type: TimelineBlockType;
  performance_id?: string; // If linked to a performance
  title?: string; // Fallback title
  start_time_projected?: string;
  duration_seconds: number;
  order_index: number;
  color_code?: string;
  created_at?: string;

  // Join
  performance?: Performance;
}
