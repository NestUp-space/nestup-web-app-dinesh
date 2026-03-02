import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";
import AboutUsHeroSection from "@/components/about-us/AboutUsHeroSection";
import AboutUsJourneySection from "@/components/about-us/AboutUsJourneySection";
import AboutUsBirthSection from "@/components/about-us/AboutUsBirthSection";
import AboutUsPhilosophySection from "@/components/about-us/AboutUsPhilosophySection";
import AboutUsProcessSection from "@/components/about-us/AboutUsProcessSection";
import AboutUsWhyNestupSection from "@/components/about-us/AboutUsWhyNestupSection";

export default function AboutUsPage() {
  return (
    <section>
      <div className="fixed top-0 left-0 right-0 w-full h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="min-h-screen bg-neutral-light text-gray-900 mt-24 w-full">
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
