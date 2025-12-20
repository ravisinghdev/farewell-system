import { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/ui/SettingsNav";
import { Separator } from "@/components/ui/separator";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen pb-24">
      {/* Bottom Floating Nav */}
      <SettingsNav farewellId={id} />

      <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your farewell configuration, roles, and preferences.
          </p>
        </div>
        <Separator className="my-6" />

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
