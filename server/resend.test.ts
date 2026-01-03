import { describe, it, expect } from "vitest";

describe("Resend API Key Validation", () => {
  it("should be able to connect to Resend API", async () => {
    const { validateResendApiKey } = await import("./_core/resend");
    
    const result = await validateResendApiKey();
    
    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.error("Resend API validation failed:", result.error);
    }
  });
});
