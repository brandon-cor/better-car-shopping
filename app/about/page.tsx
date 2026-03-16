import { Metadata } from "next";
import { AboutClient } from "./client";

export const metadata: Metadata = {
  title: "About Vehique | AI-Assisted car shopping and research",
  description: "Learn about Vehique, AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
  keywords: [
    "about Vehique",
    "AI car search company",
    "car search platform",
    "vehicle finder about",
  ],
};

export default function AboutPage() {
  return <AboutClient />;
}
