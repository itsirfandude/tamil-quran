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

    background_color: "#050505",
    theme_color: "#050505",

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
    src: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
],

    shortcuts: [
      {
        name: "வாசிப்பைத் தொடர",
        short_name: "தொடரவும்",
        url: "/bookmarks",
      },
      {
        name: "தேடல்",
        short_name: "தேடல்",
        url: "/search",
      },
    ],
  };
}
