export interface AboutSection {
  slug: string;
  title: string;
  sourceTitle: string;
  description: string;
  order: number;
}

export const aboutSections: AboutSection[] = [
  {
    order: 1,
    slug: "before-reading",
    title: "வாசிப்பதற்கு முன்",
    sourceTitle: "வாசிப்பதற்கு முன்",
    description:
      "திருக்குர்ஆனை அணுகுவதற்கு முன் தெரிந்துகொள்ள வேண்டிய அடிப்படை வழிகாட்டுதல்.",
  },
  {
    order: 2,
    slug: "how-to-use",
    title: "இந்நூலைப் பயன்படுத்தும் முறை",
    sourceTitle: "இந்நூலைப் பயன்படுத்தும் முறை",
    description: "இந்நூலை சிறப்பாகப் பயன்படுத்த உதவும் வழிமுறைகள்.",
  },
  {
    order: 3,
    slug: "translation",
    title: "இம்மொழிபெயர்ப்பு பற்றி",
    sourceTitle: "இம்மொழிபெயர்ப்பு பற்றி...",
    description: "மொழிபெயர்ப்பின் நோக்கம், நடை மற்றும் அணுகுமுறை.",
  },
  {
    order: 4,
    slug: "divine-revelation",
    title: "இது இறை வேதம்",
    sourceTitle: "இது இறை வேதம்",
    description:
      "திருக்குர்ஆன் இறைவனிடமிருந்து அருளப்பட்ட வேதம் என்பதற்கான அறிமுகம்.",
  },
  {
    order: 5,
    slug: "proofs-of-revelation",
    title: "இறைவேதம் என்பதற்கான சான்றுகள்",
    sourceTitle: "இறைவேதம் என்பதற்கான சான்றுகள்",
    description:
      "திருக்குர்ஆன் இறைவேதம் என்பதற்கான பல்வேறு சான்றுகளின் அறிமுகம்.",
  },
  {
    order: 6,
    slug: "revelation",
    title: "திருக்குர்ஆன் அருளப்பட்ட வரலாறு",
    sourceTitle: "திருக்குர்ஆன் எவ்வாறு அருளப்பட்டது?",
    description:
      "திருக்குர்ஆன் எவ்வாறு அருளப்பட்டது என்பதற்கான சுருக்கமான வரலாறு.",
  },
  {
    order: 7,
    slug: "compilation",
    title: "திருக்குர்ஆன் தொகுக்கப்பட்ட வரலாறு",
    sourceTitle: "திருக்குர்ஆன் தொகுக்கப்பட்ட வரலாறு",
    description: "திருக்குர்ஆன் தொகுக்கப்பட்ட விதம் மற்றும் அதன் பாதுகாப்பு.",
  },
];
