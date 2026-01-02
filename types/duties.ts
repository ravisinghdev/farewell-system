export type DutyStatus =
  | "unassigned"
  | "partially_assigned"
  | "fully_assigned"
  | "over_assigned"
  | "completed_pending_verification"
  | "approved"
  | "paid"
  | "archived";

export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "partially_approved";
export type PaymentMode = "online" | "offline";

export interface Duty {
  id: string;
  farewell_id: string;
  title: string;
  description: string | null;
  category: string;
  min_assignees: number;
  max_assignees: number;
  status: DutyStatus;
  created_at: string;
  updated_at: string;
}

export interface DutyAssignment {
  id: string;
  duty_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface DutyClaim {
  id: string;
  duty_id: string;
  user_id: string;
  claimed_amount: number;
  description: string | null;
  proof_url: string | null;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
}

export interface DutyVote {
  id: string;
  duty_id: string;
  claim_id?: string;
  voter_id: string;
  vote: boolean;
  note: string | null;
  created_at: string;
}

export interface PaymentReceipt {
  id: string;
  duty_id: string;
  claim_id?: string;
  user_id: string;
  payment_mode: PaymentMode;
  claimed_amount: number;
  approved_amount: number;
  deducted_amount: number;
  deduction_reason: string | null;
  approved_by: string | null;
  transaction_ref: string | null;
  status: string;
  created_at: string;
}

export interface PaymentLedgerEntry {
  id: string;
  farewell_id: string;
  reference_id: string | null;
  reference_type: string;
  credit_amount: number;
  debit_amount: number;
  user_id: string | null;
  admin_id: string | null;
  notes: string | null;
  created_at: string;
}









































