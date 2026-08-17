import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WatermarkRemoverApp } from "@/components/WatermarkRemoverApp";
import { ExplanationSection } from "@/components/ExplanationSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090d16] text-slate-100">
      <Header />
      <main className="flex-1 py-4 space-y-8">
        <WatermarkRemoverApp />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ExplanationSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
