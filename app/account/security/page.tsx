"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AccountSecurity() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sdata } = await supabase.auth.getSession();
      const userId = sdata.session?.user?.id;
      if (!userId) {
        router.push("/auth");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      const { data: sec } = await supabase
        .from("account_security")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!mounted) return;
      setProfile(prof);
      setSecurity(sec);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Account security</h2>

      <section className="mb-6 bg-neutral-800 p-4 rounded">
        <h3 className="font-medium">Two-factor authentication</h3>
        <p className="text-sm text-neutral-300">
          Protect your account with an authenticator app.
        </p>
        <div className="mt-3">
          {security?.twofa_enabled ? (
            <div className="text-green-300">2FA is enabled</div>
          ) : (
            <div className="text-yellow-300">2FA is not enabled</div>
          )}
        </div>
        <div className="mt-3">
          <a className="btn-outline" href="/account/security/2fa">
            Manage 2FA
          </a>
        </div>
      </section>

      <section className="bg-neutral-800 p-4 rounded">
        <h3 className="font-medium">Devices</h3>
        <p className="text-sm text-neutral-300">
          Recognized devices and recent activity
        </p>
        <ul className="mt-3 space-y-2">
          {(security?.devices ?? []).map((d: any) => (
            <li
              key={d.id}
              className="p-3 bg-neutral-900 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">
                  {d.ua?.slice(0, 80) ?? "Unknown device"}
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(d.detected_at).toLocaleString()}
                </div>
              </div>
              <div>
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    // remove this device
                    const newDevices = (security.devices ?? []).filter(
                      (x: any) => x.id !== d.id
                    );
                    const { error } = await supabase
                      .from("account_security")
                      .update({ devices: newDevices })
                      .eq("user_id", security.user_id);
                    if (!error)
                      setSecurity({ ...security, devices: newDevices });
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
