import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SideRays from "@/components/SideRays";
import DotField from "@/components/DotField";

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
  title: "Bricks — Employee Attendance & Order P&L Billing Manager",
  description: "Production-ready Next.js application for daily 4-session employee attendance tracking and billing order profit calibration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
        {/* Background Effects: Light Theme DotField & Dark Theme SideRays */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <DotField
            dotRadius={3.0}
            dotSpacing={18}
            bulgeStrength={80}
            glowRadius={180}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(30, 41, 59, 0.55)"
            gradientTo="rgba(79, 70, 229, 0.45)"
            glowColor="rgba(79, 70, 229, 0.25)"
          />

          <div className="w-full h-full scale-125 origin-top-right">
            <SideRays
              speed={2.2}
              rayColor1="#ffffff"
              rayColor2="#e2e8f0"
              intensity={2.8}
              spread={4.5}
              origin="top-right"
              tilt={5}
              saturation={1.0}
              blend={0.7}
              falloff={0.9}
              opacity={0.85}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-neutral-800/80 py-6 text-center text-xs text-slate-500 dark:text-neutral-400 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>&copy; {new Date().getFullYear()} Bricks Web Application. All rights reserved.</span>
              <span className="font-mono">Next.js 15 • App Router • MongoDB Mongoose</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
