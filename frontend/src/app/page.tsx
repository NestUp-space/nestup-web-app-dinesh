import { HomeSection } from "@/components/HomeSection";
import { ProcessSection } from "@/components/ProcessSection";
import { AboutSection } from "@/components/AboutSection";

export default function Home() {
  return (
    <div className="w-screen">
      <HomeSection />
      <ProcessSection />
      <AboutSection />
    </div>
  );
}
