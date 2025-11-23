import React from "react";
import Provider from "./Provider";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Auth - Farewell",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
