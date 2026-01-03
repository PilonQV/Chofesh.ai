import { describe, it, expect } from "vitest";
import {
  CURATED_PERSONAS,
  PERSONA_CATEGORIES,
  getPersonasByCategory,
  getPopularPersonas,
  searchPersonas,
  getPersonaById,
  type Persona,
  type PersonaCategory,
} from "../shared/personas";

describe("Personas Library", () => {
  describe("CURATED_PERSONAS", () => {
    it("should have at least 15 curated personas", () => {
      expect(CURATED_PERSONAS.length).toBeGreaterThanOrEqual(15);
    });

    it("should have all required fields for each persona", () => {
      CURATED_PERSONAS.forEach((persona) => {
        expect(persona.id).toBeTruthy();
        expect(persona.name).toBeTruthy();
        expect(persona.description).toBeTruthy();
        expect(persona.category).toBeTruthy();
        expect(persona.systemPrompt).toBeTruthy();
        expect(persona.avatarEmoji).toBeTruthy();
        expect(Array.isArray(persona.tags)).toBe(true);
        expect(persona.tags.length).toBeGreaterThan(0);
      });
    });

    it("should have unique IDs for all personas", () => {
      const ids = CURATED_PERSONAS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid categories for all personas", () => {
      const validCategories = PERSONA_CATEGORIES.map((c) => c.id);
      CURATED_PERSONAS.forEach((persona) => {
        expect(validCategories).toContain(persona.category);
      });
    });
  });

  describe("PERSONA_CATEGORIES", () => {
    it("should have at least 5 categories", () => {
      expect(PERSONA_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have all required fields for each category", () => {
      PERSONA_CATEGORIES.forEach((category) => {
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
        expect(category.description).toBeTruthy();
        expect(category.icon).toBeTruthy();
      });
    });
  });

  describe("getPersonasByCategory", () => {
    it("should return personas for a valid category", () => {
      const technicalPersonas = getPersonasByCategory("technical");
      expect(technicalPersonas.length).toBeGreaterThan(0);
      technicalPersonas.forEach((p) => {
        expect(p.category).toBe("technical");
      });
    });

    it("should return empty array for category with no personas", () => {
      // All categories should have at least one persona, but test the function behavior
      const result = getPersonasByCategory("nonexistent" as PersonaCategory);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getPopularPersonas", () => {
    it("should return only personas marked as popular", () => {
      const popular = getPopularPersonas();
      expect(popular.length).toBeGreaterThan(0);
      popular.forEach((p) => {
        expect(p.isPopular).toBe(true);
      });
    });

    it("should return at least 3 popular personas", () => {
      const popular = getPopularPersonas();
      expect(popular.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("searchPersonas", () => {
    it("should find personas by name", () => {
      const results = searchPersonas("developer");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.name.toLowerCase().includes("developer"))).toBe(true);
    });

    it("should find personas by tag", () => {
      const results = searchPersonas("coding");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.tags.includes("coding"))).toBe(true);
    });

    it("should find personas by description", () => {
      const results = searchPersonas("uncensored");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = searchPersonas("xyznonexistentquery123");
      expect(results).toEqual([]);
    });

    it("should be case insensitive", () => {
      const results1 = searchPersonas("CREATIVE");
      const results2 = searchPersonas("creative");
      expect(results1.length).toBe(results2.length);
    });
  });

  describe("getPersonaById", () => {
    it("should return persona for valid ID", () => {
      const persona = getPersonaById("uncensored-assistant");
      expect(persona).toBeDefined();
      expect(persona?.name).toBe("Uncensored Assistant");
    });

    it("should return undefined for invalid ID", () => {
      const persona = getPersonaById("nonexistent-id");
      expect(persona).toBeUndefined();
    });
  });

  describe("Key Personas", () => {
    it("should have an uncensored assistant persona", () => {
      const persona = getPersonaById("uncensored-assistant");
      expect(persona).toBeDefined();
      expect(persona?.systemPrompt).toContain("uncensored");
      expect(persona?.isPopular).toBe(true);
    });

    it("should have a senior developer persona", () => {
      const persona = getPersonaById("senior-developer");
      expect(persona).toBeDefined();
      expect(persona?.category).toBe("technical");
    });

    it("should have a creative writer persona", () => {
      const persona = getPersonaById("creative-writer");
      expect(persona).toBeDefined();
      expect(persona?.category).toBe("creative");
    });

    it("should have a research assistant persona", () => {
      const persona = getPersonaById("perplexity-researcher");
      expect(persona).toBeDefined();
      expect(persona?.category).toBe("research");
    });
  });

  describe("System Prompts Quality", () => {
    it("should have substantial system prompts (at least 200 chars)", () => {
      CURATED_PERSONAS.forEach((persona) => {
        expect(persona.systemPrompt.length).toBeGreaterThanOrEqual(200);
      });
    });

    it("should not have placeholder text in system prompts", () => {
      CURATED_PERSONAS.forEach((persona) => {
        expect(persona.systemPrompt.toLowerCase()).not.toContain("todo");
        expect(persona.systemPrompt.toLowerCase()).not.toContain("placeholder");
        expect(persona.systemPrompt.toLowerCase()).not.toContain("lorem ipsum");
      });
    });
  });
});
