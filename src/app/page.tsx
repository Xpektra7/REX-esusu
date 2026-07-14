import { Compare } from "@/components/landing/compare";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Nav } from "@/components/landing/nav";
import { Security } from "@/components/landing/security";
import { Testimonial } from "@/components/landing/testimonial";
import WhoItsFor from "@/components/landing/who-its-for";
import { InstallPrompt } from "@/components/shared/install-prompt";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <WhoItsFor />
        <HowItWorks />
        <Features />
        <Compare />
        <Security />
        <Testimonial />
        <Cta />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
