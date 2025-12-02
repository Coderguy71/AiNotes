import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import { StudyForgeProvider } from "@/components/providers/StudyForgeProvider";
import { XPToastHost } from "@/components/studyforge/XPToast";
import { LevelUpModal } from "@/components/studyforge/LevelUpModal";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EasyNotesAI",
  description: "Transform your thoughts into organized notes with ease — powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        <div className="decorative-blob blob-1" />
        <div className="decorative-blob blob-2" />
        <div className="decorative-blob blob-3" />
        
        <div className="accent-line" style={{ top: "20%", width: "60%", left: "20%" }} />
        <div className="accent-line" style={{ top: "60%", width: "50%", right: "10%" }} />
        
        <StudyForgeProvider>
          <PageTransition>
            {children}
          </PageTransition>
          <XPToastHost />
          <LevelUpModal />
        </StudyForgeProvider>
      </body>
    </html>
  );
}
