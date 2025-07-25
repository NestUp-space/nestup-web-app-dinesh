import { Button } from "@/components/ui/button";

export default function CallToActionSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">
          Ready to Build Smarter with Modular?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Contact us today to learn more about our modular building solutions
          and schedule your free site visit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-white text-theme-color hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform">
            Book a Free Site Visit
          </Button>
          <Button
            variant="outline"
            className="border-white text-theme-color hover:bg-white hover:text-orange-500 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            Call Us
          </Button>
        </div>
      </div>
    </section>
  );
}
