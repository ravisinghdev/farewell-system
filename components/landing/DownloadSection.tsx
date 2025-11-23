"use client";
import React, { JSX, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DownloadSection(): JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Calls server API which returns { url }
      const res = await fetch("/api/apk");
      if (!res.ok) throw new Error("Failed to get download link");
      const data = await res.json();
      const url = data?.url;
      if (!url) throw new Error("No URL returned");

      // Programmatic download
      const a = document.createElement("a");
      a.href = url;
      a.download = "farewell-app.apk";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Download failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="download" className="py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold">Get the App</h2>
        <p className="text-slate-600 mt-2">
          Download the Android APK directly or continue on the web.
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={handleDownload} disabled={loading}>
            {loading ? "Preparing…" : "Download APK"}
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Note: APK is served via a short-lived signed URL. You must have the
          signed APK stored in Supabase Storage (bucket: <code>apk</code>).
        </p>
      </div>
    </section>
  );
}
