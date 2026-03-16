/**
 * Restricted Blog Posts Configuration
 * 
 * Posts listed here require authentication and email whitelist verification.
 * Access is denied by default - only explicitly allowed emails/domains can view.
 */

export interface RestrictedPostConfig {
  /** Exact email addresses that can access this post */
  allowedEmails: string[];
  /** Email domains (without @) that can access this post */
  allowedDomains: string[];
}

export const RESTRICTED_BLOG_POSTS: Record<string, RestrictedPostConfig> = {
  "what-id-bring-to-carvana-lessons-from-building-vehique": {
    allowedEmails: ["geme.t07@gmail.com"],
    allowedDomains: ["vehique.ai"],
  },
};

/**
 * Check if a slug is restricted
 */
export function isRestrictedPost(slug: string): boolean {
  return slug in RESTRICTED_BLOG_POSTS;
}

/**
 * Check if an email is authorized to access a restricted post
 * Returns false if post is not restricted (caller should allow access)
 */
export function isEmailAuthorized(slug: string, email: string | null | undefined): boolean {
  const config = RESTRICTED_BLOG_POSTS[slug];
  if (!config) return true; // Not restricted
  if (!email) return false; // No email, deny access
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check exact email match
  if (config.allowedEmails.some(e => e.toLowerCase() === normalizedEmail)) {
    return true;
  }
  
  // Check domain match
  const emailDomain = normalizedEmail.split("@")[1];
  if (emailDomain && config.allowedDomains.some(d => d.toLowerCase() === emailDomain)) {
    return true;
  }
  
  return false;
}

