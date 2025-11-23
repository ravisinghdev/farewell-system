import React, { JSX } from "react";
import Image from "next/image";

export default function DeepSections(): JSX.Element {
  return (
    <section className="py-8 grid gap-10">
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h3 id="contribution" className="text-xl font-semibold">
            Contribution & Payments
          </h3>
          <p className="text-slate-600 mt-2">
            Track contributions in real time and integrate Razorpay for
            payments.
          </p>
        </div>
        <div>
          <div className="rounded-md overflow-hidden border">
            <Image
              src="/assets/contributions.png"
              alt="contrib"
              width={720}
              height={420}
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="rounded-md overflow-hidden border">
            <Image
              src="/assets/duties.png"
              alt="duties"
              width={720}
              height={420}
            />
          </div>
        </div>
        <div>
          <h3 id="duties" className="text-xl font-semibold">
            Duty Assignment & Reimbursements
          </h3>
          <p className="text-slate-600 mt-2">
            Upload receipts, approve reimbursements, and maintain an audit
            trail.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h3 id="chat" className="text-xl font-semibold">
            Real-time Chat
          </h3>
          <p className="text-slate-600 mt-2">
            Channels, mentions and media sharing powered by Supabase Realtime.
          </p>
        </div>
        <div>
          <div className="rounded-md overflow-hidden border">
            <Image src="/assets/chat.png" alt="chat" width={720} height={420} />
          </div>
        </div>
      </div>
    </section>
  );
}
