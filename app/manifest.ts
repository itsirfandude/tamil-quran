import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "திருக்குர்ஆன் • Tamil Quran",
    short_name: "குர்ஆன்",
    description:
      "தமிழில் தெளிவான திருக்குர்ஆன் வாசிப்பும் 521 விளக்கக் குறிப்புகளும்.",

    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",

    background_color: "#000000",
    theme_color: "#000000",

    lang: "ta",

    categories: ["books", "reference", "education"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    shortcuts: [
      {
        name: "தொடர்ந்து படிக்க",
        short_name: "தொடரவும்",
        description: "உங்கள் கடைசி வாசிப்பு இடத்திலிருந்து தொடரவும்.",
        url: "/",
      },
      {
        name: "தேடல்",
        short_name: "தேடல்",
        url: "/search",
      },
    ],
  };
}
