import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRestrictedPost, isEmailAuthorized } from "@/lib/blog/restricted-posts";

// Bot user agents that should bypass auth middleware entirely
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'applebot',
  'gptbot',
  'chatgpt',
  'anthropic',
  'claude',
  'perplexitybot',
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

/**
 * Extract blog slug from pathname
 * Returns null if not a blog post path
 */
function extractBlogSlug(pathname: string): string | null {
  const match = pathname.match(/^\/blog\/([^/]+)$/);
  return match ? match[1] : null;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const userAgent = request.headers.get('user-agent');
  const pathname = request.nextUrl.pathname;
  
  // Check if this is a restricted blog post
  const blogSlug = extractBlogSlug(pathname);
  
  if (blogSlug && isRestrictedPost(blogSlug)) {
    // Block bots from restricted content
    if (isBot(userAgent)) {
      const restrictedUrl = new URL('/blog/restricted', request.url);
      restrictedUrl.searchParams.set('reason', 'private');
      return NextResponse.redirect(restrictedUrl);
    }
    
    // Get auth state
    const { userId } = await auth();
    
    if (!userId) {
      // Not authenticated - redirect to restricted page with sign-in hint
      const restrictedUrl = new URL('/blog/restricted', request.url);
      restrictedUrl.searchParams.set('reason', 'auth');
      restrictedUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(restrictedUrl);
    }
    
    // Get user email from Clerk
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const primaryEmail = user.emailAddresses.find(
        e => e.id === user.primaryEmailAddressId
      )?.emailAddress;
      
      if (!isEmailAuthorized(blogSlug, primaryEmail)) {
        // Authenticated but not authorized
        const restrictedUrl = new URL('/blog/restricted', request.url);
        restrictedUrl.searchParams.set('reason', 'access');
        return NextResponse.redirect(restrictedUrl);
      }
      
      // Authorized - allow access
      return NextResponse.next();
    } catch (error) {
      // Error fetching user - deny access to be safe
      console.error('Error checking user authorization:', error);
      const restrictedUrl = new URL('/blog/restricted', request.url);
      restrictedUrl.searchParams.set('reason', 'error');
      return NextResponse.redirect(restrictedUrl);
    }
  }
  
  // For non-restricted routes, let bots through without auth middleware
  if (isBot(userAgent)) {
    return NextResponse.next();
  }
  
  // Normal request handling
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
