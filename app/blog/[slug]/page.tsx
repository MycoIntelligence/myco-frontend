import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { articleAliases, articles } from "@/lib/articles";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (articleAliases[slug]) redirect(`/blog/${articleAliases[slug]}`);
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  return <PageShell eyebrow={article.category} title={article.title} lead={article.excerpt}>
    <article className="max-w-[720px]"><p className="text-sm uppercase tracking-wider text-[#526c69]">{article.readTime}</p><div className="mt-8 space-y-6 text-lg leading-relaxed text-[#44595a]">{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><Link href="/blog" className="mt-10 inline-block font-medium underline underline-offset-4">Back to all articles</Link></article>
  </PageShell>;
}
