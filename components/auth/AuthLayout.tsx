import React, { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-md p-6 rounded-2xl shadow-lg">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to Farewell
          </p>
        </header>

        <main>{children}</main>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Farewell — All rights reserved
          </span>
        </footer>
      </div>
    </div>
  );
}
