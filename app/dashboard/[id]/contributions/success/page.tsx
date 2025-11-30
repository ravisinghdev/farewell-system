"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="h-[50vh] flex flex-col items-center justify-center gap-6 text-center animate-in zoom-in duration-500">
      <CheckCircle2 className="w-24 h-24 text-green-500" />
      <h1 className="text-6xl font-bold tracking-tighter">Thank You!</h1>
      <p className="text-2xl text-gray-500">
        Your contribution has been received.
      </p>
      <div className="flex gap-4 mt-8">
        <Button
          asChild
          className="h-14 px-8 text-lg rounded-full bg-black text-white hover:bg-gray-900"
        >
          <Link href="overview">Go to Overview</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-14 px-8 text-lg rounded-full"
        >
          <Link href="history">View Receipt</Link>
        </Button>
      </div>
    </div>
  );
}
