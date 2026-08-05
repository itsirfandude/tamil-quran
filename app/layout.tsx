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
  title: {
    default: "திருக்குர்ஆன் • Tamil Quran",
    template: "%s • திருக்குர்ஆன்",
  },

  description:
    "தமிழில் தெளிவான திருக்குர்ஆன் வாசிப்பும் 521 விளக்கக் குறிப்புகளும்.",

  applicationName: "திருக்குர்ஆன்",

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "குர்ஆன்",
  },

  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
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
