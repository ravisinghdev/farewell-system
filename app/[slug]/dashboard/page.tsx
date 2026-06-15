import { createClient } from "@/lib/supabase/server"
import { logoutAction } from "@/features/auth/auth.actions"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Welcome back! You are securely logged in as:
          <br />
          <strong className="text-foreground">{user.email}</strong>
        </p>
        <div className="p-4 bg-muted rounded-lg text-left text-sm overflow-auto">
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
        <form action={logoutAction}>
          <button 
            type="submit" 
            className="w-full inline-flex justify-center rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            Sign out securely
          </button>
        </form>
      </div>
    </div>
  )
}
