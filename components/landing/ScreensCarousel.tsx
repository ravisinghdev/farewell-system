import React, { JSX } from "react";
import Image from "next/image";

const SCREENS = ["/assets/s1.png", "/assets/s2.png", "/assets/s3.png"];

export default function ScreensCarousel(): JSX.Element {
  return (
    <section id="screens" className="py-8">
      <h2 className="text-2xl font-semibold">Screenshots</h2>
      <p className="text-slate-600 mt-2">
        Explore the app UI — dashboard, contributions, chat and gallery.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCREENS.map((s, i) => (
          <div key={i} className="rounded-md overflow-hidden border">
            <Image src={s} alt={`screen ${i + 1}`} width={640} height={420} />
          </div>
        ))}
      </div>
    </section>
  );
}
