import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revokeSessionAction } from "@/features/auth/session.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, Tablet, Smartphone, Laptop } from "lucide-react"

function getDeviceIcon(deviceName: string, platform: string) {
  const name = (deviceName + " " + platform).toLowerCase()
  if (name.includes("mobile") || name.includes("iphone") || name.includes("android")) {
    return <Smartphone className="w-5 h-5 text-muted-foreground" />
  }
  if (name.includes("tablet") || name.includes("ipad")) {
    return <Tablet className="w-5 h-5 text-muted-foreground" />
  }
  if (name.includes("mac") || name.includes("windows") || name.includes("linux")) {
    return <Monitor className="w-5 h-5 text-muted-foreground" />
  }
  return <Laptop className="w-5 h-5 text-muted-foreground" />
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // Fetch all tracked sessions for the user
  const { data: sessions, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("last_active_at", { ascending: false })

  if (error) {
    console.error("Error fetching sessions:", error)
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
        <p className="text-muted-foreground">
          Manage and revoke your active sessions across different devices.
        </p>
      </div>

      <div className="grid gap-4">
        {sessions?.length === 0 && (
          <p className="text-sm text-muted-foreground">No tracked sessions found.</p>
        )}
        
        {sessions?.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {getDeviceIcon(session.device_name || "", session.platform || "")}
                  {session.device_name}
                  {session.revoked_at && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                      Revoked
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {session.platform} • {session.ip_address}
                </CardDescription>
              </div>
              {!session.revoked_at && (
                <form action={revokeSessionAction.bind(null, session.id)}>
                  <Button variant="destructive" size="sm" type="submit">
                    Revoke
                  </Button>
                </form>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                <p>Last active: {new Date(session.last_active_at).toLocaleString()}</p>
                <p>Created: {new Date(session.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
