import ProcessCard from '@/components/landing-page/ProcessCard';
import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";
import Image from "next/legacy/image";

export default function AboutUsPage() {
  return (
    <section>
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
        <div className="min-h-screen bg-gray-50 text-gray-900 mt-24">
        <main className="w-full">
          {/* Hero Section */}
          <section className="relative text-center py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-theme-color mb-8 leading-tight">
                About Nestup
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                From a dusty workshop to a revolution in modular interiors.
              </p>
            </div>
          </section>

          {/* Journey Section */}
          <section className="py-12 md:py-16 lg:py-20 px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <Image
                  src="/img/20250725_1901_Modern Office Entrance_remix_01k10wd1s3e589qtwtm9esg9bx.png"
                  alt="Modern office entrance showcasing interior design work"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="md:order-1 min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  From a dusty workshop to a revolution in modular interiors
                </h2>
                
                <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-800">
                  <p>
                    <span className="text-lg md:text-xl font-semibold text-theme-color">&ldquo;Nine years ago</span>, in my third year of college, I found myself helping my dad set up a CNC router in his humble woodworking shop. I had no idea that those <span className="font-semibold text-gray-900">late nights learning software and training his team</span> would plant the first seeds of a much larger journey.
                  </p>
                  
                  <p>
                    After graduating, I worked in the corporate world for a while. But the real calling came when I teamed up with a close friend to start an interior design firm. The creative satisfaction was immense, but so were the challenges—<span className="font-semibold text-darkest-text">manual carpentry teams, unreliable timelines, and frustrating compromises</span> on quality and cost.
                  </p>
                  
                  <p className="text-lg md:text-xl font-medium text-gray-900">
                    We knew there had to be a better way.&rdquo;
                  </p>
                  <p className="text-m md:text-lg font-small text-theme-color text-right">
                    - Vamsi Pratap (Founder and CEO - Nestup)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Birth of Nestup - A Visual Break */}
          <section className="py-12 md:py-16 lg:py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-theme-color mb-8 leading-tight">
                And that&apos;s how <span className="italic">Nestup</span> was born.
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed font-light">
                A system, a mindset, and a promise to fix what&apos;s broken in the interiors industry.
              </p>
              <Image
                src="/img/AC69B49B-1960-4DE3-AAC7-A3F46C7F1190.jpeg"
                alt="The birth of Nestup vision"
                width={800}
                height={600}
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="py-12 md:py-16 lg:py-20 px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Image
                  src="/img/20250725_1924_Enhanced CNC Machine Image_remix_01k10xnsbdf67b11qq6cnazc94.png"
                  alt="Modern CNC machinery in factory"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="text-theme-color">Nestup</span> is not just a modular factory.
                </h2>
                
                <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-800">
                  <p>
                    With years of hands-on experience, countless mistakes (and lessons), and a deep understanding of what designers and homeowners truly need, we built Nestup from the ground up to be <span className="font-bold text-medium-interactive">faster, smarter, and more reliable</span>.
                  </p>
                  
                  <p>
                    We&apos;ve <span className="font-semibold text-theme-color">automated the chaos</span>—turning weeks of on-site carpentry into a streamlined, factory-led process that&apos;s clean, predictable, and high-quality.
                  </p>
                  
                  <p>
                    Our factory uses <span className="font-bold text-dark-color">cutting-edge CNC tech, automated pressing, and precise edge banding</span> to craft modular units that are built to last and made to fit. Every screw hole, hinge notch, and groove is calculated down to the millimeter.
                  </p>
                  
                  <div className="bg-lightest-bg p-6 rounded-xl border-l-4 border-theme-color">
                    <p className="text-lg md:text-xl font-bold text-gray-900">
                      And the best part? Once materials are received, we commit to dispatch-ready modulars in just <span className="text-theme-color">14 working days</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="py-12 md:py-16 lg:py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center text-theme-color mb-16 leading-tight">
                Our Process in a Nutshell
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <ProcessCard title="Accurate Site Measurements" stepNumber={1} />
                <ProcessCard title="Design Inputs & 3D Modeling" stepNumber={2} />
                <ProcessCard title="Factory Production & QA" stepNumber={3} />
                <ProcessCard title="Plug-and-Play Installation" stepNumber={4} />
              </div>
              
              <div className="bg-lightest-bg p-8 rounded-xl border border-light-border">
                <p className="text-lg md:text-xl text-center text-gray-800 leading-relaxed">
                  <span className="font-bold text-dark-color">We provide every detail</span> from cutlists to installation guides, so even a basic carpentry team can install with confidence. Need help? Our <span className="font-semibold text-very-dark-text">trained teams and site engineers</span> are just a call away.
                </p>
              </div>
            </div>
          </section>

          {/* Why Nestup Exists Section */}
          <section className="py-12 md:py-16 lg:py-20 px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <Image
                  src="/img/20250725_2021_Futuristic Indian Interiors_simple_compose_01k110zryqewfarpmbgz0xkbr1.png"
                  alt="Futuristic Indian interiors representing modern convenience"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="md:order-1 min-h-[400px] md:min-h-[500px] flex flex-col justify-center space-y-4">
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-theme-color leading-tight">
                  Why Nestup Exists
                </h2>
                
                <div className="space-y-4 text-base md:text-lg leading-relaxed text-gray-800">
                  <div className="bg-lightest-bg p-6 rounded-xl border-l-4 border-theme-color">
                    <p className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                      Because in a country where groceries arrive in <span className="text-medium-interactive">10 minutes</span> and UPI payments are done in a blink—why does interior work still take <span className="text-darkest-text">2-3 months</span>?
                    </p>
                  </div>
                  
                  <p className="text-lg md:text-xl font-semibold text-center">
                    We believe <span className="text-dark-color font-bold">convenience is no longer a luxury. It&apos;s a necessity.</span>
                  </p>
                  
                  <div className="space-y-4">
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      Our vision is simple:
                    </p>
                    <p className="text-base md:text-lg leading-relaxed">
                      Walk into a Nestup showroom, choose your designs, and have your woodwork installed <span className="font-bold text-theme-color">within a day</span>. We&apos;re not there yet, but we&apos;re getting close—<span className="font-semibold text-medium-interactive">fast</span>.
                    </p>
                  </div>
                  
                  <div className="bg-lighter-bg p-6 rounded-xl">
                    <p className="text-lg md:text-xl font-bold text-center text-gray-900 leading-relaxed">
                      We&apos;re not just building wardrobes and kitchens.<br/>
                      <span className="text-theme-color">We&apos;re building a new standard</span> for how interiors should be done in India.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer/>
    </section>
  );
}
