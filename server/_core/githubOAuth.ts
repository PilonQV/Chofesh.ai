/**
 * GitHub OAuth Integration
 * 
 * Handles GitHub OAuth flow for seamless repository access.
 * Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

// Encryption key derived from JWT_SECRET
const getEncryptionKey = (): Buffer => {
  const secret = process.env.JWT_SECRET || "CHANGE-ME-IN-PRODUCTION-MIN-32-CHARS";
  // Use first 32 bytes of secret as encryption key
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32));
};

/**
 * Encrypt a string value for secure storage
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a stored encrypted value
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Get GitHub OAuth configuration from environment
 */
export function getGitHubConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }

  // Determine redirect URI based on environment
  const baseUrl = process.env.VITE_APP_URL || 
                  process.env.PUBLIC_URL || 
                  "http://localhost:3000";
  
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/github/callback`,
  };
}

/**
 * Check if GitHub OAuth is configured
 */
export function isGitHubOAuthConfigured(): boolean {
  return getGitHubConfig() !== null;
}

/**
 * Generate GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(state: string): string | null {
  const config = getGitHubConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "repo read:user user:email",
    state,
    allow_signup: "false",
  });

  return `${GITHUB_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GitHubTokenResponse | null> {
  const config = getGitHubConfig();
  if (!config) return null;

  try {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      console.error("GitHub token exchange failed:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("GitHub OAuth error:", data.error_description || data.error);
      return null;
    }

    return data as GitHubTokenResponse;
  } catch (error) {
    console.error("GitHub token exchange error:", error);
    return null;
  }
}

/**
 * Get GitHub user info using access token
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Chofesh.ai",
      },
    });

    if (!response.ok) {
      console.error("GitHub user fetch failed:", response.status);
      return null;
    }

    const user = await response.json();

    // If email is not public, try to get it from emails endpoint
    if (!user.email) {
      const emailResponse = await fetch(`${GITHUB_API_URL}/user/emails`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Chofesh.ai",
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        if (primaryEmail) {
          user.email = primaryEmail.email;
        }
      }
    }

    return user as GitHubUser;
  } catch (error) {
    console.error("GitHub user fetch error:", error);
    return null;
  }
}

/**
 * Make authenticated GitHub API request
 */
export async function githubApiRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const url = endpoint.startsWith("http") 
      ? endpoint 
      : `${GITHUB_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Chofesh.ai",
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`GitHub API error (${endpoint}):`, response.status);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`GitHub API request error (${endpoint}):`, error);
    return null;
  }
}

/**
 * List user's repositories
 */
export async function listUserRepos(accessToken: string, page = 1, perPage = 30): Promise<any[]> {
  const repos = await githubApiRequest<any[]>(
    accessToken,
    `/user/repos?sort=updated&per_page=${perPage}&page=${page}`
  );
  return repos || [];
}

/**
 * Get repository contents
 */
export async function getRepoContents(
  accessToken: string,
  owner: string,
  repo: string,
  path = ""
): Promise<any[]> {
  const contents = await githubApiRequest<any[]>(
    accessToken,
    `/repos/${owner}/${repo}/contents/${path}`
  );
  return Array.isArray(contents) ? contents : [];
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const file = await githubApiRequest<any>(
    accessToken,
    `/repos/${owner}/${repo}/contents/${path}`
  );
  
  if (!file || !file.content) return null;
  
  // GitHub returns base64 encoded content
  return Buffer.from(file.content, "base64").toString("utf-8");
}

/**
 * Get repository branches
 */
export async function getRepoBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<any[]> {
  const branches = await githubApiRequest<any[]>(
    accessToken,
    `/repos/${owner}/${repo}/branches`
  );
  return branches || [];
}

/**
 * Get repository pull requests
 */
export async function getRepoPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<any[]> {
  const prs = await githubApiRequest<any[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls?state=${state}`
  );
  return prs || [];
}

/**
 * Get pull request files
 */
export async function getPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<any[]> {
  const files = await githubApiRequest<any[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${pullNumber}/files`
  );
  return files || [];
}

/**
 * Create a review comment on a pull request
 */
export async function createPRReviewComment(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  commitId: string,
  path: string,
  line: number
): Promise<any | null> {
  return githubApiRequest(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({
        body,
        commit_id: commitId,
        path,
        line,
      }),
    }
  );
}

/**
 * Submit a pull request review
 */
export async function submitPRReview(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT"
): Promise<any | null> {
  return githubApiRequest(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: "POST",
      body: JSON.stringify({
        body,
        event,
      }),
    }
  );
}
