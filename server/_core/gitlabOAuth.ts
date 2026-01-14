import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const GITLAB_OAUTH_URL = "https://gitlab.com/oauth/authorize";
const GITLAB_TOKEN_URL = "https://gitlab.com/oauth/token";
const GITLAB_API_URL = "https://gitlab.com/api/v4";

const getEncryptionKey = (): Buffer => {
  const secret = process.env.JWT_SECRET || "default-secret-key-change-me";
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32));
};

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface GitLabOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getGitLabConfig(): GitLabOAuthConfig | null {
  const clientId = process.env.GITLAB_CLIENT_ID;
  const clientSecret = process.env.GITLAB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }

  const baseUrl = process.env.VITE_APP_URL || process.env.PUBLIC_URL || "http://localhost:3000";
  
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/gitlab/callback`,
  };
}

export function isGitLabOAuthConfigured(): boolean {
  return getGitLabConfig() !== null;
}

export function getGitLabAuthUrl(state: string): string | null {
  const config = getGitLabConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "api read_user",
    state,
  });

  return `${GITLAB_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<any | null> {
  const config = getGitLabConfig();
  if (!config) return null;

  try {
    const response = await fetch(GITLAB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      console.error("GitLab token exchange failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("GitLab token exchange error:", error);
    return null;
  }
}

export async function getGitLabUser(accessToken: string): Promise<any | null> {
  try {
    const response = await fetch(`${GITLAB_API_URL}/user`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("GitLab user fetch failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("GitLab user fetch error:", error);
    return null;
  }
}

export async function gitlabApiRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const url = endpoint.startsWith("http") 
      ? endpoint 
      : `${GITLAB_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`GitLab API error (${endpoint}):`, response.status);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`GitLab API request error (${endpoint}):`, error);
    return null;
  }
}
