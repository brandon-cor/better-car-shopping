import { Metadata } from "next";
import { LegalClient } from "./client";

export const metadata: Metadata = {
  title: "Legal | Terms & Privacy",
  description: "Vehique legal information, terms of service, and privacy policy. Review our terms, privacy practices, and user agreements for our AI-powered car search platform.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalPage() {
  return <LegalClient />;
}
