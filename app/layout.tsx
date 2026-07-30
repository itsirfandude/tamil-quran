import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Noto_Serif_Tamil, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/components/PrefsProvider";
import { NotesProvider } from "@/components/NotesProvider";

const arabicFont = Amiri_Quran({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: "400",
  display: "swap",
});

const tamilFont = Noto_Serif_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const uiFont = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "திருக்குர்ஆன் | Tamil Quran",
  description:
    "Read the Holy Quran in Tamil translation with the original Arabic, verse by verse.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ta"
      data-theme="dark"
      className={`${arabicFont.variable} ${tamilFont.variable} ${displayFont.variable} ${uiFont.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PrefsProvider>
          <NotesProvider>{children}</NotesProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
