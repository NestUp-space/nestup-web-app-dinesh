import { HomeSection } from "@components/HomeSection";
import { ProcessSection } from "@components/ProcessSection";
import { Footer } from "@/components/Footer";


export default function Home() {
  return (
    <div className="w-screen">
      <HomeSection />
      <ProcessSection />
      <Footer/>
    </div>
  );
}
