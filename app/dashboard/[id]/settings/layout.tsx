import { Metadata } from "next";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { getSettings } from "@/app/actions/settings-actions";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const settings = user ? await getSettings(user.id) : null;

  return (
    <SettingsProvider initialSettings={settings} userId={user?.id || ""}>
      <div className="space-y-6 p-4 pb-16 md:p-10 md:pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
            <SettingsSidebar farewellId={id} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </SettingsProvider>
  );
}
