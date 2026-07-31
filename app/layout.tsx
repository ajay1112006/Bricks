import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SideRays from "@/components/SideRays";
import WatermarkV from "@/components/WatermarkV";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ELYON TRADERS — The Most High",
  description: "Elyon Traders official enterprise portal for employee session attendance logging and order profit calibration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-[#FAF9F6] dark:bg-[#0A090D] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
        {/* Background Effects: Watermark V & Dark Theme SideRays */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <WatermarkV />

          <div className="w-full h-full scale-125 origin-top-right">
            <SideRays
              speed={2.2}
              rayColor1="#c5a880"
              rayColor2="#7e6544"
              intensity={2.8}
              spread={4.5}
              origin="top-right"
              tilt={5}
              saturation={1.0}
              blend={0.7}
              falloff={0.9}
              opacity={0.75}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-amber-900/10 dark:border-amber-500/20 py-6 text-center text-xs text-slate-500 dark:text-neutral-400 transition-colors duration-300 bg-white/30 dark:bg-black/40 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-serif tracking-wider font-semibold text-amber-900/80 dark:text-amber-200/90">
                &copy; {new Date().getFullYear()} ELYON TRADERS — THE MOST HIGH. All rights reserved.
              </span>
              <span className="font-mono text-amber-700/70 dark:text-amber-400/70">
                +91 9566957474 • elyontraderss@gmail.com
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
