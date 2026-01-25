/**
 * Content Moderation System
 * Detects potentially inappropriate or policy-violating content in user prompts
 */

export type FlagReason = 
  | "nsfw_content" 
  | "violence" 
  | "hate_speech" 
  | "illegal_activity" 
  | "self_harm" 
  | "spam" 
  | "harassment" 
  | "other";

export interface ModerationResult {
  isFlagged: boolean;
  flagReason?: FlagReason;
  flagDetails?: string;
  confidence: number; // 0-100
}

// Keywords and patterns for content moderation
// These are organized by category for maintainability

const NSFW_PATTERNS = [
  // Explicit sexual content requests
  /\b(nude|naked|porn|xxx|nsfw|hentai|erotic|sexual|sex\s*scene)\b/i,
  /\b(undress|strip|topless|bottomless)\b/i,
  /\b(explicit|adult\s*content|18\+|mature\s*content)\b/i,
  // Body parts in sexual context
  /\b(genitals?|breasts?|nipples?|buttocks?|penis|vagina)\b/i,
  // Sexual acts
  /\b(intercourse|masturbat|orgasm|fetish|kink)\b/i,
];

const VIOLENCE_PATTERNS = [
  // Weapons and harm
  /\b(kill|murder|assassinat|execute|slaughter)\b/i,
  /\b(bomb|explosive|weapon|gun|knife|attack)\s+(how|make|build|create)/i,
  /\b(torture|mutilat|dismember|decapitat)\b/i,
  // Threats
  /\b(threat|threaten|hurt|harm|injure)\s+(someone|people|person|them|him|her)/i,
  // Gore
  /\b(gore|blood|guts|viscera|graphic\s+violence)\b/i,
];

const HATE_SPEECH_PATTERNS = [
  // Slurs and discriminatory language (keeping this minimal and general)
  /\b(hate|kill|destroy)\s+(all|every)\s+(jews?|muslims?|christians?|blacks?|whites?|asians?|gays?|trans)/i,
  /\b(racial\s+slur|ethnic\s+cleansing|genocide)\b/i,
  /\b(supremac|inferior\s+race|subhuman)\b/i,
];

const ILLEGAL_ACTIVITY_PATTERNS = [
  // Drug manufacturing
  /\b(make|cook|synthesize|manufacture)\s+(meth|cocaine|heroin|fentanyl|drugs?)\b/i,
  // Hacking and fraud
  /\b(hack|crack|breach|exploit)\s+(password|account|system|bank)\b/i,
  /\b(credit\s+card\s+fraud|identity\s+theft|phishing|scam)\b/i,
  // Child exploitation (critical)
  /\b(child|minor|underage|kid)\s+(porn|nude|naked|sexual)\b/i,
  /\b(cp|csam|pedo|pedophil)\b/i,
  // Terrorism
  /\b(terrorist|terrorism|bomb\s+making|mass\s+shooting)\b/i,
];

const SELF_HARM_PATTERNS = [
  /\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die)\b/i,
  /\b(self[- ]?harm|cut\s+myself|hurt\s+myself)\b/i,
  /\b(overdose|pills\s+to\s+die|how\s+to\s+die)\b/i,
];

const HARASSMENT_PATTERNS = [
  /\b(dox|doxx|personal\s+information|home\s+address)\b/i,
  /\b(stalk|stalking|follow\s+them|track\s+them)\b/i,
  /\b(revenge\s+porn|leaked\s+photos|expose\s+them)\b/i,
  /\b(bully|harass|intimidat)\s+(them|him|her|someone)/i,
];

const SPAM_PATTERNS = [
  // Repetitive content
  /(.)\1{10,}/i, // Same character repeated 10+ times
  // Promotional spam
  /\b(buy\s+now|click\s+here|free\s+money|get\s+rich\s+quick)\b/i,
];

/**
 * Analyzes content for policy violations
 */
export function moderateContent(content: string): ModerationResult {
  if (!content || typeof content !== "string") {
    return { isFlagged: false, confidence: 100 };
  }

  const normalizedContent = content.toLowerCase().trim();

  // Check each category in order of severity
  
  // 1. Illegal activity (highest priority)
  for (const pattern of ILLEGAL_ACTIVITY_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "illegal_activity",
        flagDetails: `Detected illegal activity pattern: "${match?.[0] || "matched"}"`,
        confidence: 95,
      };
    }
  }

  // 2. Self-harm (critical for user safety)
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "self_harm",
        flagDetails: `Detected self-harm content: "${match?.[0] || "matched"}"`,
        confidence: 90,
      };
    }
  }

  // 3. Violence
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "violence",
        flagDetails: `Detected violent content: "${match?.[0] || "matched"}"`,
        confidence: 85,
      };
    }
  }

  // 4. Hate speech
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "hate_speech",
        flagDetails: `Detected hate speech: "${match?.[0] || "matched"}"`,
        confidence: 85,
      };
    }
  }

  // 5. NSFW content
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "nsfw_content",
        flagDetails: `Detected NSFW content: "${match?.[0] || "matched"}"`,
        confidence: 80,
      };
    }
  }

  // 6. Harassment
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      const match = normalizedContent.match(pattern);
      return {
        isFlagged: true,
        flagReason: "harassment",
        flagDetails: `Detected harassment content: "${match?.[0] || "matched"}"`,
        confidence: 75,
      };
    }
  }

  // 7. Spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      return {
        isFlagged: true,
        flagReason: "spam",
        flagDetails: "Detected spam pattern",
        confidence: 70,
      };
    }
  }

  // No violations detected
  return { isFlagged: false, confidence: 100 };
}

/**
 * Get human-readable label for flag reason
 */
export function getFlagReasonLabel(reason: FlagReason): string {
  const labels: Record<FlagReason, string> = {
    nsfw_content: "NSFW/Adult Content",
    violence: "Violence/Threats",
    hate_speech: "Hate Speech",
    illegal_activity: "Illegal Activity",
    self_harm: "Self-Harm",
    spam: "Spam",
    harassment: "Harassment",
    other: "Other Violation",
  };
  return labels[reason] || reason;
}

/**
 * Get severity level for flag reason (for UI display)
 */
export function getFlagSeverity(reason: FlagReason): "critical" | "high" | "medium" | "low" {
  const severities: Record<FlagReason, "critical" | "high" | "medium" | "low"> = {
    illegal_activity: "critical",
    self_harm: "critical",
    violence: "high",
    hate_speech: "high",
    nsfw_content: "medium",
    harassment: "medium",
    spam: "low",
    other: "low",
  };
  return severities[reason] || "low";
}
