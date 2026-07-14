"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";
import { useRef } from "react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";

const testimonials = [
  {
    quote:
      "Esusu helped my market group buy our first shared delivery truck in just 6 months. It\u2019s safe and easy.",
    name: "Chidi K.",
    role: "Lagos Merchant",
  },
  {
    quote:
      "I\u2019ve saved more in 3 months with my circle than I did all last year. The transparency keeps everyone honest.",
    name: "Amina A.",
    role: "Abuja Trader",
  },
  {
    quote:
      "The auto-collection means nobody forgets. My group hasn\u2019t missed a single payment since we started.",
    name: "Tunde O.",
    role: "Lagos Engineer",
  },
  {
    quote:
      "Finally, an Esusu platform that works. The payout scheduling is a game-changer for our cooperative.",
    name: "Folake D.",
    role: "Ibadan Cooperative Lead",
  },
];

export function Testimonial() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / testimonials.length;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="mb-10 text-center">
          <p className="eyebrow text-muted-foreground">Testimonials</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Trusted by savers like you
          </h2>
        </div>

        {/* Scroll-snap carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
          >
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="w-[85vw] max-w-md shrink-0 snap-start"
              >
                <div className="flex h-full flex-col justify-between gap-6 rounded-xl border border-border bg-card p-8 md:p-10">
                  <p className="text-base leading-relaxed text-foreground md:text-lg">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <DiceBearAvatar name={t.name} />
                    <div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous testimonial"
              className="card-interactive flex size-10 items-center justify-center rounded-full"
            >
              <ArrowLeft01Icon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next testimonial"
              className="card-interactive flex size-10 items-center justify-center rounded-full"
            >
              <ArrowRight01Icon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
