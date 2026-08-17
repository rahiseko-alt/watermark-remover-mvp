import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WatermarkRemoverApp } from "@/components/WatermarkRemoverApp";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090d16] text-slate-100">
      <Header />
      <main className="flex-1 py-4">
        <WatermarkRemoverApp />
      </main>
      <Footer />
    </div>
  );
}
