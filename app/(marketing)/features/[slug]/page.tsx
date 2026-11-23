import { notFound } from "next/navigation";
import FeaturesPage from "@/src/marketing/features";
import { features } from "@/src/marketing/feature-data";
import "@/src/marketing/feature-layout.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return features.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);
  return { title: feature?.label, description: feature?.summary };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!features.some((item) => item.slug === slug)) notFound();
  return <FeaturesPage slug={slug} />;
}
