# Remaining Tasks for Farewell Management System

Based on the comparison between `farewell-plan.txt` and the current project structure, the following features and components are yet to be fully implemented.

## 1. Duty Assignment System (Backend)
**Status:** ⚠️ Partial (UI exists, Backend missing)
- **Missing Actions:** `duty-actions.ts` is missing.
- **Required Features:**
  - Create duties (Title, Description, Expense Limit).
  - Assign duties to members.
  - Update duty status (Pending, In Progress, Done).
  - **Note:** UI components exist in `components/duties`, but they need to be connected to server actions.

## 2. Reimbursement & Financial Workflow
**Status:** ❌ Missing
- **Missing Actions:** Linked to Duty actions.
- **Required Features:**
  - Upload receipts for duties (Server action to handle file upload to Supabase Storage and DB insert).
  - Admin approval/rejection workflow for receipts.
  - Automatic balance updates upon approval.
  - Export reimbursement data.

## 3. Audit Log System
**Status:** ❌ Missing
- **Missing Components:** No `audit_logs` table or logging mechanism found.
- **Required Features:**
  - Database table `audit_logs` (action, user_id, target_id, metadata, timestamp).
  - Middleware or helper function to log critical actions (login, payment, duty change, reimbursement approval).
  - Admin view to browse audit logs.

## 4. Device Fingerprinting
**Status:** ⚠️ Partial
- **Existing:** Helper `createDeviceFingerprint` exists in `lib/security/auth-security.ts`.
- **Missing:**
  - Logic to store this fingerprint during Login/Signup in `auth-actions.ts`.
  - Database column/table to track user devices.
  - Security monitoring view.

## 5. Mobile App (APK Distribution)
**Status:** ⏳ Pending
- **Current State:** `android` directory exists (Capacitor initialized).
- **Missing:**
  - APK build and distribution pipeline.
  - Supabase Storage bucket for APKs.
  - Signed URL generation for secure download.

## 6. Final Polish & Optimization
- **Testing:** Comprehensive testing of the "People" pages (Students, Teachers, Juniors) and Transaction History.
- **Real-time:** Verify real-time updates for all new modules (Duties, Reimbursements).

## Recommended Next Steps
1.  **Implement Duty & Reimbursement Backend:** Create `app/actions/duty-actions.ts` and ensure database tables (`duties`, `duty_assignments`, `duty_receipts`) exist.
2.  **Implement Audit Logging:** Create `audit_logs` table and a reusable logging function.
3.  **Connect Duty UI:** Wire up the existing `components/duties` to the new actions.
