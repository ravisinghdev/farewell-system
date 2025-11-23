import React, { JSX } from "react";
import FeatureCard from "@/components/landing/FeatureCard";

type Feature = {
  id: string;
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    id: "contribution",
    title: "Contribution Management",
    desc: "Create pools, set targets and integrate Razorpay.",
  },
  {
    id: "duties",
    title: "Duty & Reimbursements",
    desc: "Assign duties, upload receipts and approve reimbursements.",
  },
  {
    id: "chat",
    title: "Real-time Chat",
    desc: "Channels, mentions and media sharing.",
  },
  {
    id: "gallery",
    title: "Gallery & Memories",
    desc: "Upload photos and curate albums.",
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    desc: "Granular admin/member roles.",
  },
  {
    id: "multi",
    title: "Multi-platform",
    desc: "Web + Mobile (APK download available).",
  },
];

export default function Features(): JSX.Element {
  return (
    <section id="features" className="py-8">
      <h2 className="text-2xl font-semibold">
        Packed features for every farewell
      </h2>
      <p className="text-slate-600 mt-2">
        From financial transparency to real-time collaboration and galleries.
      </p>
      <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.id} id={f.id} title={f.title} desc={f.desc} />
        ))}
      </div>
    </section>
  );
}
