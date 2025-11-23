import React, { JSX } from "react";

const FAQS = [
  {
    q: "How secure is my data?",
    a: "We store data on Supabase with Row Level Security. Payments use Razorpay.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed through Razorpay checkout. Contribution pools show live balances.",
  },
  {
    q: "Can multiple admins manage a group?",
    a: "Yes — main admin and additional admins with granular roles.",
  },
  {
    q: "Is the APK safe?",
    a: "Host the signed APK in Supabase Storage and serve via signed URLs.",
  },
];

export default function FAQ(): JSX.Element {
  return (
    <section id="faq" className="py-8">
      <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {FAQS.map((f, i) => (
          <div key={i} className="p-4 border rounded-md">
            <div className="font-medium">{f.q}</div>
            <div className="text-slate-600 mt-2 text-sm">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
