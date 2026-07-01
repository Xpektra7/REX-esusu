import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { BentoStats } from "@/components/landing/bento-stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Testimonial } from "@/components/landing/testimonial";
import { Security } from "@/components/landing/security";
import { InstallSection } from "@/components/landing/install-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <BentoStats />
        <HowItWorks />
        <Features />
        <Testimonial />
        <Security />
        <InstallSection />
      </main>
      <Footer />
    </div>
  );
}
