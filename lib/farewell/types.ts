export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type PostLoginDestination =
  | { kind: "dashboard"; farewellId: string }
  | { kind: "welcome" }
  | { kind: "pending-approval"; farewellId?: string };
