import { Metadata } from "next";
import { BlogClient } from "./client";

export const metadata: Metadata = {
  title: "Blog | Insights & Updates",
  description: "Read the latest insights, engineering deep-dives, and updates from the Vehique team. Learn how we're building the future of AI-powered car shopping.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Blog | Vehique",
    description: "Read the latest insights, engineering deep-dives, and updates from the Vehique team.",
    type: "website",
    url: "https://vehique.ai/blog",
    siteName: "Vehique",
    images: [
      {
        url: "https://vehique.ai/aesthetic/vehique-home.png",
        secureUrl: "https://vehique.ai/aesthetic/vehique-home.png",
        width: 1200,
        height: 630,
        alt: "Vehique Blog",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Vehique",
    description: "Read the latest insights, engineering deep-dives, and updates from the Vehique team.",
    images: ["https://vehique.ai/aesthetic/vehique-home.png"],
    site: "@vehiqueai",
  },
};

export default function BlogPage() {
  return <BlogClient />;
}

