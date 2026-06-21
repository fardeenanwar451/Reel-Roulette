import { notFound } from "next/navigation";
import SectionClient from "@/components/SectionClient";

const VALID_SOURCES = ["imdb", "letterboxd", "metacritic", "rt"];

export function generateStaticParams() {
  return VALID_SOURCES.map((source) => ({ source }));
}

export default function SectionPage({ params }) {
  if (!VALID_SOURCES.includes(params.source)) {
    notFound();
  }
  return <SectionClient sourceKey={params.source} />;
}
