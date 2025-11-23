import React, { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function FeatureCard({
  id,
  title,
  desc,
}: {
  id?: string;
  title: string;
  desc: string;
}): JSX.Element {
  return (
    <Card id={id} className="border">
      <CardContent>
        <div className="font-medium text-lg">{title}</div>
        <p className="text-sm text-slate-600 mt-2">{desc}</p>
      </CardContent>
    </Card>
  );
}
