import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "./client";
import { getBlogPost, getAllBlogPosts } from "@/lib/blog/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      url: `https://vehique.ai/blog/${slug}`,
      siteName: "Vehique",
      images: [
        {
          url: "https://vehique.ai/aesthetic/vehique-home.png",
          secureUrl: "https://vehique.ai/aesthetic/vehique-home.png",
          width: 1200,
          height: 630,
          alt: post.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["https://vehique.ai/aesthetic/vehique-home.png"],
      site: "@vehiqueai",
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}

