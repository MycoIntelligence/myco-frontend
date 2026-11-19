import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { articles } from "@/lib/articles";

const categories = ["All", "Review", "Testing", "Security"];

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = categories.find((item) => item.toLowerCase() === category?.toLowerCase()) || "All";
  const filtered = selected === "All" ? articles : articles.filter((post) => post.category === selected);
  return <PageShell eyebrow="KNOWLEDGE" title="Notes on engineering review." lead="Explore the questions behind reviewing changes in context.">
    <nav aria-label="Filter articles by category" className="mb-10 flex flex-wrap gap-2">{categories.map((item) => <Link key={item} href={item === "All" ? "/blog" : `/blog?category=${item.toLowerCase()}`} aria-current={item === selected ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm ${item === selected ? "bg-[#071a1b] text-white" : "bg-white/40 text-[#071a1b] hover:bg-white/70"}`}>{item}</Link>)}</nav>
    <div className="grid gap-5 md:grid-cols-3">{filtered.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`} className="flex min-h-[250px] flex-col rounded-[22px] border border-[#071a1b]/15 bg-white/35 p-7 transition-colors hover:bg-white/60"><span className="text-xs uppercase tracking-wider text-[#526c69]">{post.category} · {post.readTime}</span><h2 className="mt-6 text-2xl leading-tight text-[#071a1b]">{post.title}</h2><p className="mt-4 leading-relaxed text-[#44595a]">{post.excerpt}</p><span className="mt-auto pt-6 font-medium underline underline-offset-4">Read article</span></Link>)}</div>
  </PageShell>;
}
