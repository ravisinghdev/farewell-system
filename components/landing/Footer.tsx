import React, { JSX } from "react";
import Link from "next/link";

export default function Footer(): JSX.Element {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-semibold">
            F
          </div>
          <div>
            <div className="text-sm font-semibold">Farewell</div>
            <div className="text-xs text-slate-500">
              organise · collect · celebrate
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-600">
          © {new Date().getFullYear()} Farewell. All rights reserved. ·{" "}
          <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
