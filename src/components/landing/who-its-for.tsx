"use client";

import Image from "next/image";

interface AudienceCard {
  src: string;
  alt: string;
  tag: string;
  title: string;
  description: string;
}

const audienceCards: AudienceCard[] = [
  {
    src: "/X.jpg",
    alt: "Farmer working the land",
    tag: "01",
    title: "Farmers & Artisans",
    description:
      "Seasonal earners who need savings that flex with their cash flow.",
  },
  {
    src: "/african market woman shopping from local market Stock Photo _ Adobe Stock.jpg",
    alt: "Market trader at her stall",
    tag: "02",
    title: "Market Traders",
    description:
      "Daily-income earners saving a portion of each day\u2019s sales with people they trust.",
  },
  {
    src: "/alns.jpg",
    alt: "Cooperative group members",
    tag: "03",
    title: "Cooperative Groups",
    description:
      "Organised groups that need transparent tracking, automated collections, and fair payouts.",
  },
  {
    src: "/sjedwhebd.jpg.jpg",
    alt: "Professional reviewing finances",
    tag: "04",
    title: "Salary Earners",
    description:
      "Monthly earners automating contributions toward goals without thinking about it.",
  },
  {
    src: "/Vibrant African Friends Sharing Moments with Phones in a Park _ Free Photo.jpg",
    alt: "Young friends saving together",
    tag: "05",
    title: "Students & Young Earners",
    description:
      "First-time savers building the habit together in small, manageable circles.",
  },
];

function AudienceTile({ card }: { card: AudienceCard }) {
  return (
    <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-border">
      <Image
        src={card.src}
        alt={card.alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/15 to-transparent" />
      <span className="eyebrow absolute top-4 left-4 text-background/70">
        {card.tag}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg font-bold text-background">{card.title}</h3>
        <p className="mt-1 text-sm text-background/75">{card.description}</p>
      </div>
    </div>
  );
}

export default function WhoItsFor() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="mb-10 md:mb-12">
          <p className="eyebrow text-muted-foreground">Who it&rsquo;s for</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Built for real people, real communities
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audienceCards.map((card) => (
            <AudienceTile key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
