"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";
import { getAllBlogPosts, BlogPost } from "@/lib/blog/posts";

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm p-8 transition-all duration-500 hover:border-border/40 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/5">
          {/* Featured badge */}
          {post.featured && (
            <div className="absolute top-4 right-4">
              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Featured
              </span>
            </div>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/5 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Title */}
          <h2 className="font-google-sans-flex text-2xl md:text-3xl font-light tracking-tight mb-4 group-hover:text-primary transition-colors duration-300 leading-tight">
            {post.title}
          </h2>
          
          {/* Excerpt */}
          <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
            {post.excerpt}
          </p>
          
          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTime}
              </span>
            </div>
            
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Read more
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const posts = getAllBlogPosts();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="min-h-screen bg-background font-google-sans-flex selection:bg-foreground selection:text-background">
      <PublicHeader />
      
      <div className="container mx-auto max-w-4xl px-6 pt-32 pb-24">
        <motion.a 
          href="/" 
          onClick={handleBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block text-sm text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
        >
          Back
        </motion.a>
        
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-16 mb-20"
        >
          <h1 className="font-google-sans-flex text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Insights, engineering deep-dives, and updates from the team building the future of AI-powered car shopping.
          </p>
        </motion.header>
        
        {/* Blog posts grid */}
        <div className="space-y-8">
          {posts.map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} />
          ))}
        </div>
        
        {/* Empty state for when more posts come */}
        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground">No posts yet. Check back soon.</p>
          </motion.div>
        )}
      </div>
      
      <Footer 
        language={language}
        setLanguage={setLanguage}
        isLangOpen={isLangOpen}
        setIsLangOpen={setIsLangOpen}
        languages={US_POPULAR_LANGUAGES}
        t={t}
      />
    </div>
  );
}

