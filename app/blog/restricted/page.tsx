import { Metadata } from "next";
import { RestrictedClient } from "./client";

export const metadata: Metadata = {
  title: "Content Unavailable | Vehique",
  description: "This content is no longer publicly available.",
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: Promise<{ reason?: string; redirect?: string }>;
}

export default async function RestrictedPage({ searchParams }: Props) {
  const params = await searchParams;
  return <RestrictedClient reason={params.reason} redirectPath={params.redirect} />;
}

