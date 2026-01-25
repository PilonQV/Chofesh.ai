import { describe, it, expect } from "vitest";
import { moderateContent, getFlagReasonLabel, getFlagSeverity } from "./_core/contentModeration";

describe("Content Moderation System", () => {
  describe("moderateContent", () => {
    it("should return not flagged for normal content", () => {
      const result = moderateContent("Hello, how are you today?");
      expect(result.isFlagged).toBe(false);
      expect(result.confidence).toBe(100);
    });

    it("should return not flagged for empty content", () => {
      const result = moderateContent("");
      expect(result.isFlagged).toBe(false);
    });

    it("should flag NSFW content", () => {
      const result = moderateContent("Show me nude images");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("nsfw_content");
      expect(result.flagDetails).toContain("NSFW");
    });

    it("should flag violence content", () => {
      const result = moderateContent("I want to murder someone and torture them");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("violence");
    });

    it("should flag illegal activity", () => {
      const result = moderateContent("How to make meth at home");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("illegal_activity");
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it("should flag self-harm content", () => {
      const result = moderateContent("I want to kill myself");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("self_harm");
    });

    it("should flag hate speech", () => {
      const result = moderateContent("Hate all jews and destroy them");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("hate_speech");
    });

    it("should flag harassment content", () => {
      const result = moderateContent("I want to dox someone and expose their personal information");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("harassment");
    });

    it("should flag spam patterns", () => {
      const result = moderateContent("aaaaaaaaaaaaaaaaaaaaaa");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("spam");
    });

    it("should not flag legitimate technical questions", () => {
      const result = moderateContent("How do I implement a login system with password hashing?");
      expect(result.isFlagged).toBe(false);
    });

    it("should not flag legitimate creative writing", () => {
      const result = moderateContent("Write a story about a detective solving a mystery");
      expect(result.isFlagged).toBe(false);
    });

    it("should handle case insensitivity", () => {
      const result = moderateContent("SHOW ME NUDE IMAGES");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("nsfw_content");
    });
  });

  describe("getFlagReasonLabel", () => {
    it("should return correct labels for all flag reasons", () => {
      expect(getFlagReasonLabel("nsfw_content")).toBe("NSFW/Adult Content");
      expect(getFlagReasonLabel("violence")).toBe("Violence/Threats");
      expect(getFlagReasonLabel("hate_speech")).toBe("Hate Speech");
      expect(getFlagReasonLabel("illegal_activity")).toBe("Illegal Activity");
      expect(getFlagReasonLabel("self_harm")).toBe("Self-Harm");
      expect(getFlagReasonLabel("spam")).toBe("Spam");
      expect(getFlagReasonLabel("harassment")).toBe("Harassment");
      expect(getFlagReasonLabel("other")).toBe("Other Violation");
    });
  });

  describe("getFlagSeverity", () => {
    it("should return critical severity for illegal_activity and self_harm", () => {
      expect(getFlagSeverity("illegal_activity")).toBe("critical");
      expect(getFlagSeverity("self_harm")).toBe("critical");
    });

    it("should return high severity for violence and hate_speech", () => {
      expect(getFlagSeverity("violence")).toBe("high");
      expect(getFlagSeverity("hate_speech")).toBe("high");
    });

    it("should return medium severity for nsfw_content and harassment", () => {
      expect(getFlagSeverity("nsfw_content")).toBe("medium");
      expect(getFlagSeverity("harassment")).toBe("medium");
    });

    it("should return low severity for spam and other", () => {
      expect(getFlagSeverity("spam")).toBe("low");
      expect(getFlagSeverity("other")).toBe("low");
    });
  });
});
