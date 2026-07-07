"use client";

import Image from "next/image";

interface AudienceCard {
  src: string;
  alt: string;
  title: string;
  description: string;
}

const audienceCards: AudienceCard[] = [
  {
    src: "/X.jpg",
    alt: "Farmer working the land",
    title: "Farmers & Artisans",
    description:
      "Seasonal earners who need savings that flex with their cash flow.",
  },
  {
    src: "/african market woman shopping from local market Stock Photo _ Adobe Stock.jpg",
    alt: "Market trader at her stall",
    title: "Market Traders",
    description:
      "Daily-income earners saving a portion of each day\u2019s sales with people they trust.",
  },
  {
    src: "/alns.jpg",
    alt: "Cooperative group members",
    title: "Cooperative Groups",
    description:
      "Organised groups that need transparent tracking, automated collections, and fair payouts.",
  },
  {
    src: "/sjedwhebd.jpg.jpg",
    alt: "Professional reviewing finances",
    title: "Salary Earners",
    description:
      "Monthly earners automating contributions toward goals without thinking about it.",
  },
  {
    src: "/Vibrant African Friends Sharing Moments with Phones in a Park _ Free Photo.jpg",
    alt: "Young friends saving together",
    title: "Students & Young Earners",
    description:
      "First-time savers building the habit together in small, manageable circles.",
  },
];

function ParallaxCard({ card }: { card: AudienceCard }) {
  return (
    <div className="relative mx-auto w-full md:w-[50vw] aspect-video min-h-100 overflow-hidden rounded-xl">
      <div className="absolute inset-0 will-change-transform">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          className="object-cover"
          sizes="(max-width: 720px) 80vw, 720px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-foreground/20 to-foreground/10" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
        <h3 className="text-3xl font-bold text-background md:text-4xl lg:text-5xl">
          {card.title}
        </h3>
        <p className="mt-2 max-w-md text-base text-background/70 md:text-lg">
          {card.description}
        </p>
      </div>
    </div>
  );
}

export default function WhoItsFor() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          Who is Esusu for?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Built for real people, real communities, real savings.
        </p>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-8 px-6">
        {audienceCards.map((card) => (
          <ParallaxCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}
