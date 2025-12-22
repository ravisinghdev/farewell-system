// types/performance.ts

export type PerformanceType =
  | "dance"
  | "solo"
  | "duet"
  | "group"
  | "skit"
  | "band"
  | "special_act"
  | "anchor_segment";
export type PerformanceStatus = "draft" | "rehearsing" | "ready" | "locked";
export type RiskLevel = "low" | "medium" | "high";
export type StageRole =
  | "lead_coordinator"
  | "backup_coordinator"
  | "performer"
  | "stage_manager"
  | "light_sound_tech";

export interface Performance {
  id: string;
  farewell_id: string;
  title: string;
  type: PerformanceType;
  status: PerformanceStatus;
  risk_level: RiskLevel; // New
  duration_seconds: number; // New
  health_score: number; // 0-100 // New
  is_locked: boolean; // New
  stage_requirements: {
    mics?: number;
    audio_backup?: boolean;
    props?: string[];
    lighting?: string;
  };
  sequence_order?: number;
  lead_coordinator_id?: string;
  backup_coordinator_id?: string;
  created_at: string;
  // Joins
  lead_coordinator?: { full_name: string; avatar_url: string };
  backup_coordinator?: { full_name: string; avatar_url: string };
  performers?: PerformancePerformer[];
}

export interface PerformancePerformer {
  id: string;
  performance_id: string;
  user_id: string;
  role: StageRole;
  is_backup: boolean;
  user?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export interface RehearsalSession {
  id: string;
  farewell_id: string;
  performance_id?: string;
  title?: string; // Optional override
  start_time: string;
  end_time: string;
  venue: string;
  goal?: string;
  is_mandatory: boolean;
  performance?: Performance;
}
