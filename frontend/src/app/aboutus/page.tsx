import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Nestup — our journey, philosophy, and approach to modular furniture manufacturing.",
};
import AboutUsHeroSection from "@/components/about-us/AboutUsHeroSection";
import AboutUsJourneySection from "@/components/about-us/AboutUsJourneySection";
import AboutUsBirthSection from "@/components/about-us/AboutUsBirthSection";
import AboutUsPhilosophySection from "@/components/about-us/AboutUsPhilosophySection";
import AboutUsProcessSection from "@/components/about-us/AboutUsProcessSection";
import AboutUsWhyNestupSection from "@/components/about-us/AboutUsWhyNestupSection";

export default function AboutUsPage() {
  return (
    <section>
      <div className="min-h-screen bg-neutral-light text-gray-900 mt-24 w-screen">
        <main className="w-full">
          <AboutUsHeroSection />
          <AboutUsJourneySection />
          <AboutUsBirthSection />
          <AboutUsPhilosophySection />
          <AboutUsProcessSection />
          <AboutUsWhyNestupSection />
        </main>
      </div>
      <Footer/>
    </section>
  );
}
