import { InstallPrompt } from "@/components/shared/install-prompt";
import { BentoStats } from "@/components/landing/bento-stats";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Nav } from "@/components/landing/nav";
import { Security } from "@/components/landing/security";
import { Testimonial } from "@/components/landing/testimonial";
import WhoItsFor from "@/components/landing/who-its-for";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <WhoItsFor />
        <BentoStats />
        <HowItWorks />
        <Features />
        <Testimonial />
        <Security />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
