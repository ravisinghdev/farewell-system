import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runVerification() {
  console.log("Starting verification...");

  const emailPrefix = `test_${Date.now()}`;
  const adminEmail = `${emailPrefix}_admin@example.com`;
  const studentEmail = `${emailPrefix}_student@example.com`;
  const password = "password123";

  let adminUser: any;
  let studentUser: any;

  try {
    // 1. Create Users
    console.log("Creating users...");
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: "Test Admin" },
      });
    if (adminError) throw adminError;
    adminUser = adminData;

    const { data: studentData, error: studentError } =
      await supabase.auth.admin.createUser({
        email: studentEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: "Test Student" },
      });
    if (studentError) throw studentError;
    studentUser = studentData;

    console.log("Users created:", adminUser.user.id, studentUser.user.id);

    // 2. Create Farewell
    console.log("Creating farewell...");
    const { data: farewell, error: farewellError } = await supabase
      .from("farewells")
      .insert({
        name: `Test Farewell ${Date.now()}`,
        year: 2024,
        created_by: adminUser.user.id,
      })
      .select()
      .single();
    if (farewellError) throw farewellError;
    console.log("Farewell created:", farewell.id);

    // 3. Add Members
    console.log("Adding members...");
    await supabase.from("farewell_members").insert([
      {
        farewell_id: farewell.id,
        user_id: adminUser.user.id,
        role: "admin",
        status: "approved",
      },
      {
        farewell_id: farewell.id,
        user_id: studentUser.user.id,
        role: "student",
        status: "approved",
      },
    ]);

    // 4. Create Duty (as Admin)
    console.log("Creating duty...");
    // We can use the RPC or direct insert since we are using service role here for setup,
    // but let's try to simulate the flow.
    // Ideally we should use the RLS-protected client for each user, but for simplicity we use service role
    // and verify the data structure.

    const { data: duty, error: dutyError } = await supabase
      .from("duties")
      .insert({
        farewell_id: farewell.id,
        title: "Test Duty",
        description: "Test Description",
        expense_limit: 1000,
        created_by: adminUser.user.id,
      })
      .select()
      .single();
    if (dutyError) throw dutyError;
    console.log("Duty created:", duty.id);

    // 5. Assign Duty (RPC)
    console.log("Assigning duty...");
    // We need to call RPC as admin.
    // Since we are using service role, we can impersonate or just call it (service role bypasses RLS but RPC checks might use auth.uid())
    // The RPC uses `auth.uid()` so we need to impersonate.
    // Supabase JS doesn't easily support impersonation without signing a token.
    // For this test script, we will just insert directly into tables to verify the SCHEMA and TRIGGERS/RPC logic
    // where possible, or use a custom client with a signed token.

    // Let's just insert assignment directly to test the flow
    const { data: assignment, error: assignError } = await supabase
      .from("duty_assignments")
      .insert({
        duty_id: duty.id,
        user_id: studentUser.user.id,
      })
      .select()
      .single();
    if (assignError) throw assignError;
    console.log("Duty assigned:", assignment.id);

    // 6. Upload Receipt (Student)
    console.log("Uploading receipt...");
    const { data: receipt, error: receiptError } = await supabase
      .from("duty_receipts")
      .insert({
        duty_assignment_id: assignment.id,
        uploader_id: studentUser.user.id,
        amount: 500,
        notes: "Test Receipt",
      })
      .select()
      .single();
    if (receiptError) throw receiptError;
    console.log("Receipt uploaded:", receipt.id);

    // 7. Approve Receipt (Admin RPC)
    console.log("Approving receipt...");
    // We need to call the RPC. The RPC checks `is_farewell_admin` which checks `auth.uid()`.
    // We can't easily mock `auth.uid()` with service role client in a simple script without generating a JWT.
    // So we will manually execute the logic the RPC does to verify the ledger entry creation triggers/constraints if any,
    // OR we can just try to call the RPC and see if it fails (it will fail due to auth.uid()).

    // Instead, let's just verify the tables exist and we could insert data.
    // To properly test RPCs, we need to sign in.

    const { data: adminSession, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password,
      });
    if (loginError) throw loginError;

    const adminClient = createClient(
      supabaseUrl!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${adminSession.session.access_token}`,
          },
        },
      }
    );

    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      "approve_duty_receipt",
      {
        _receipt_id: receipt.id,
      }
    );

    if (rpcError) throw rpcError;
    console.log("Receipt approved:", rpcResult);

    // 8. Verify Ledger
    console.log("Verifying ledger...");
    const { data: ledger, error: ledgerError } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("farewell_id", farewell.id);

    if (ledgerError) throw ledgerError;
    if (ledger.length !== 1)
      throw new Error(`Expected 1 ledger entry, found ${ledger.length}`);
    if (ledger[0].amount != 500)
      throw new Error(`Expected amount 500, found ${ledger[0].amount}`);

    console.log("Ledger verified:", ledger[0]);
    console.log("SUCCESS: All checks passed.");
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    // Cleanup
    console.log("Cleaning up...");
    if (adminUser) await supabase.auth.admin.deleteUser(adminUser.user.id);
    if (studentUser) await supabase.auth.admin.deleteUser(studentUser.user.id);
    // Farewell cascade delete should handle the rest
  }
}

runVerification();
