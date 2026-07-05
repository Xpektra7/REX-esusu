// who-its-for.tsx
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface AudienceCard {
  src: string;
  alt: string;
  caption: string;
}

const audienceCards: AudienceCard[] = [
  {
    src: "/X.jpg",
    alt: "Student saving with Esusu",
    caption: "Farmers and Artisans.",
  },
  {
    src: "/african market woman shopping from local market Stock Photo _ Adobe Stock.jpg",
    alt: "Market trader using Esusu to save daily earnings",
    caption: "Market Traders.",
  },
  {
    src: "/alns.jpg",
    alt: "Salary earner saving a portion of their income",
    caption: "Cooperative Groups.",
  },
  {
    src: "/sjedwhebd.jpg.jpg",
    alt: "Small business owner managing savings",
    caption: "Salary Earners.",
  },
  {
    src: "/Vibrant African Friends Sharing Moments with Phones in a Park _ Free Photo.jpg",
    alt: "Friends and family saving together in a group",
    caption: "Students and Young Earners.",
  },
];

export default function WhoItsFor() {
  return (
    <section>
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <h2 className="text-center text-3xl font-semibold text-foreground">
          Who is Esusu for?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 border border-border rounded-2xl p-6 md:p-8 mt-8">
          {audienceCards.map((card) => (
            <Card
              key={card.caption}
              className="overflow-hidden border-border bg-card" 
            >
              <div className="relative aspect-square w-full bg-muted">
                <Image
                  src={card.src}
                  alt={card.alt}
                  fill
                  className="object-cover border border-t-black"
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-center text-sm sm:text-base text-card-foreground font-bold">
                  {card.caption}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <hr className="mt-8 border-border" />
      </div>
    </section>
  );
}