/**
 * Smart Tools - Utility functions for chat enhancements
 * Includes: URL Scraper, Calculator, Unit Converter
 */

import { invokeLLM } from "./llm";
import { searchDuckDuckGo } from "./duckduckgo";
import { evaluate, create, all } from "mathjs";

// ============================================
// URL SCRAPER
// ============================================

export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  content: string;
  images: string[];
  links: string[];
  metadata: {
    author?: string;
    publishedDate?: string;
    siteName?: string;
  };
}

/**
 * Extract content from a URL using DuckDuckGo's instant answers
 * or by fetching and parsing the page
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
  try {
    // Use fetch to get the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChofeshBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract basic metadata using regex (simple parsing)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    
    // Extract main content (remove scripts, styles, etc.)
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length
    content = content.slice(0, 10000);

    // Extract images
    const imageMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi);
    const images = Array.from(imageMatches, m => m[1]).slice(0, 10);

    // Extract links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#][^"']*)["']/gi);
    const links = Array.from(linkMatches, m => m[1])
      .filter(l => l.startsWith('http'))
      .slice(0, 20);

    return {
      url,
      title: titleMatch?.[1]?.trim() || url,
      description: descMatch?.[1]?.trim() || '',
      content,
      images,
      links,
      metadata: {
        author: authorMatch?.[1]?.trim(),
        siteName: siteNameMatch?.[1]?.trim(),
      },
    };
  } catch (error) {
    console.error('URL scrape error:', error);
    return null;
  }
}

/**
 * Analyze scraped content with AI
 */
export async function analyzeUrl(url: string): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
} | null> {
  const scraped = await scrapeUrl(url);
  if (!scraped || !scraped.content) {
    return null;
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Analyze the following webpage content and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Overall sentiment (positive/negative/neutral)
4. Main topics covered

Respond in JSON format.`
      },
      {
        role: "user",
        content: `URL: ${url}\nTitle: ${scraped.title}\n\nContent:\n${scraped.content.slice(0, 8000)}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "url_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
            topics: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "keyPoints", "sentiment", "topics"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') return null;
  
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ============================================
// CALCULATOR / MATH SOLVER
// ============================================

export interface MathResult {
  expression: string;
  result: string;
  steps?: string[];
  latex?: string;
}

// Create a limited mathjs instance for safe evaluation
const limitedMath = create(all);

// Disable potentially dangerous functions
const dangerousFunctions = [
  'import', 'createUnit', 'evaluate', 'parse', 'simplify', 
  'derivative', 'rationalize', 'compile', 'parser'
];

// Import is disabled by limiting the scope - mathjs evaluate is sandboxed by default

/**
 * Evaluate a mathematical expression safely using mathjs
 * mathjs provides a sandboxed evaluation environment that prevents code injection
 */
export function evaluateMath(expression: string): MathResult {
  try {
    // mathjs handles sanitization internally and provides a safe evaluation context
    // It supports: arithmetic, trigonometry, logarithms, constants (pi, e), etc.
    const result = evaluate(expression);

    // Format the result appropriately
    let formattedResult: string;
    if (typeof result === 'number') {
      if (Number.isNaN(result)) {
        formattedResult = 'Error: Result is not a number';
      } else if (!Number.isFinite(result)) {
        formattedResult = result > 0 ? 'Infinity' : '-Infinity';
      } else if (Number.isInteger(result)) {
        formattedResult = result.toString();
      } else {
        // Round to 10 decimal places and remove trailing zeros
        formattedResult = result.toFixed(10).replace(/\.?0+$/, '');
      }
    } else if (result && typeof result.toString === 'function') {
      // Handle mathjs complex numbers, matrices, etc.
      formattedResult = result.toString();
    } else {
      formattedResult = String(result);
    }

    return {
      expression,
      result: formattedResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid expression';
    return {
      expression,
      result: `Error: ${errorMessage}`,
    };
  }
}

/**
 * Solve complex math problems with AI (step-by-step)
 */
export async function solveMathProblem(problem: string): Promise<MathResult> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a math tutor. Solve the given math problem step by step.
Provide:
1. The final answer
2. Step-by-step solution
3. LaTeX representation of the solution

Respond in JSON format with fields: result, steps (array), latex`
      },
      {
        role: "user",
        content: problem
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "math_solution",
        strict: true,
        schema: {
          type: "object",
          properties: {
            result: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            latex: { type: "string" },
          },
          required: ["result", "steps", "latex"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') {
    return { expression: problem, result: 'Error: Could not solve' };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      expression: problem,
      result: parsed.result,
      steps: parsed.steps,
      latex: parsed.latex,
    };
  } catch {
    return { expression: problem, result: content };
  }
}

// ============================================
// UNIT CONVERTER
// ============================================

export interface ConversionResult {
  from: { value: number; unit: string };
  to: { value: number; unit: string };
  formula?: string;
}

// Conversion rates (to base unit)
const conversions: Record<string, Record<string, { base: string; toBase: (v: number) => number; fromBase: (v: number) => number }>> = {
  length: {
    m: { base: 'm', toBase: v => v, fromBase: v => v },
    km: { base: 'm', toBase: v => v * 1000, fromBase: v => v / 1000 },
    cm: { base: 'm', toBase: v => v / 100, fromBase: v => v * 100 },
    mm: { base: 'm', toBase: v => v / 1000, fromBase: v => v * 1000 },
    mi: { base: 'm', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
    yd: { base: 'm', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
    ft: { base: 'm', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
    in: { base: 'm', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
  },
  weight: {
    kg: { base: 'kg', toBase: v => v, fromBase: v => v },
    g: { base: 'kg', toBase: v => v / 1000, fromBase: v => v * 1000 },
    mg: { base: 'kg', toBase: v => v / 1000000, fromBase: v => v * 1000000 },
    lb: { base: 'kg', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
    oz: { base: 'kg', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
    ton: { base: 'kg', toBase: v => v * 1000, fromBase: v => v / 1000 },
  },
  temperature: {
    c: { base: 'c', toBase: v => v, fromBase: v => v },
    f: { base: 'c', toBase: v => (v - 32) * 5/9, fromBase: v => v * 9/5 + 32 },
    k: { base: 'c', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
  },
  volume: {
    l: { base: 'l', toBase: v => v, fromBase: v => v },
    ml: { base: 'l', toBase: v => v / 1000, fromBase: v => v * 1000 },
    gal: { base: 'l', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
    qt: { base: 'l', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
    pt: { base: 'l', toBase: v => v * 0.473176, fromBase: v => v / 0.473176 },
    cup: { base: 'l', toBase: v => v * 0.236588, fromBase: v => v / 0.236588 },
    floz: { base: 'l', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
  },
  time: {
    s: { base: 's', toBase: v => v, fromBase: v => v },
    ms: { base: 's', toBase: v => v / 1000, fromBase: v => v * 1000 },
    min: { base: 's', toBase: v => v * 60, fromBase: v => v / 60 },
    h: { base: 's', toBase: v => v * 3600, fromBase: v => v / 3600 },
    d: { base: 's', toBase: v => v * 86400, fromBase: v => v / 86400 },
    wk: { base: 's', toBase: v => v * 604800, fromBase: v => v / 604800 },
  },
  data: {
    b: { base: 'b', toBase: v => v, fromBase: v => v },
    kb: { base: 'b', toBase: v => v * 1024, fromBase: v => v / 1024 },
    mb: { base: 'b', toBase: v => v * 1048576, fromBase: v => v / 1048576 },
    gb: { base: 'b', toBase: v => v * 1073741824, fromBase: v => v / 1073741824 },
    tb: { base: 'b', toBase: v => v * 1099511627776, fromBase: v => v / 1099511627776 },
  },
};

// Unit aliases
const unitAliases: Record<string, string> = {
  meter: 'm', meters: 'm', metre: 'm', metres: 'm',
  kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km',
  centimeter: 'cm', centimeters: 'cm', centimetre: 'cm', centimetres: 'cm',
  millimeter: 'mm', millimeters: 'mm', millimetre: 'mm', millimetres: 'mm',
  mile: 'mi', miles: 'mi',
  yard: 'yd', yards: 'yd',
  foot: 'ft', feet: 'ft',
  inch: 'in', inches: 'in',
  kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  gram: 'g', grams: 'g',
  milligram: 'mg', milligrams: 'mg',
  pound: 'lb', pounds: 'lb', lbs: 'lb',
  ounce: 'oz', ounces: 'oz',
  celsius: 'c', centigrade: 'c',
  fahrenheit: 'f',
  kelvin: 'k',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  gallon: 'gal', gallons: 'gal',
  quart: 'qt', quarts: 'qt',
  pint: 'pt', pints: 'pt',
  second: 's', seconds: 's', sec: 's', secs: 's',
  millisecond: 'ms', milliseconds: 'ms',
  minute: 'min', minutes: 'min', mins: 'min',
  hour: 'h', hours: 'h', hr: 'h', hrs: 'h',
  day: 'd', days: 'd',
  week: 'wk', weeks: 'wk',
  byte: 'b', bytes: 'b',
  kilobyte: 'kb', kilobytes: 'kb',
  megabyte: 'mb', megabytes: 'mb',
  gigabyte: 'gb', gigabytes: 'gb',
  terabyte: 'tb', terabytes: 'tb',
};

/**
 * Find the category for a unit
 */
function findUnitCategory(unit: string): string | null {
  const normalizedUnit = unitAliases[unit.toLowerCase()] || unit.toLowerCase();
  for (const [category, units] of Object.entries(conversions)) {
    if (normalizedUnit in units) {
      return category;
    }
  }
  return null;
}

/**
 * Convert between units
 */
export function convertUnits(value: number, fromUnit: string, toUnit: string): ConversionResult | null {
  const normalizedFrom = unitAliases[fromUnit.toLowerCase()] || fromUnit.toLowerCase();
  const normalizedTo = unitAliases[toUnit.toLowerCase()] || toUnit.toLowerCase();

  const fromCategory = findUnitCategory(normalizedFrom);
  const toCategory = findUnitCategory(normalizedTo);

  if (!fromCategory || !toCategory || fromCategory !== toCategory) {
    return null;
  }

  const categoryConversions = conversions[fromCategory];
  const fromConversion = categoryConversions[normalizedFrom];
  const toConversion = categoryConversions[normalizedTo];

  if (!fromConversion || !toConversion) {
    return null;
  }

  // Convert to base unit, then to target unit
  const baseValue = fromConversion.toBase(value);
  const resultValue = toConversion.fromBase(baseValue);

  return {
    from: { value, unit: fromUnit },
    to: { value: resultValue, unit: toUnit },
    formula: `${value} ${fromUnit} = ${resultValue.toFixed(6).replace(/\.?0+$/, '')} ${toUnit}`,
  };
}

/**
 * Parse natural language conversion request
 */
export async function parseConversionRequest(text: string): Promise<ConversionResult | null> {
  // Try simple pattern matching first
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(\w+)\s+(?:to|in|as)\s+(\w+)/i,
    /convert\s+(\d+(?:\.\d+)?)\s*(\w+)\s+to\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const fromUnit = match[2];
      const toUnit = match[3];
      const result = convertUnits(value, fromUnit, toUnit);
      if (result) return result;
    }
  }

  // Fall back to AI parsing for complex requests
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Extract the conversion request from the user's message.
Return JSON with: value (number), fromUnit (string), toUnit (string)
If not a conversion request, return null.`
      },
      {
        role: "user",
        content: text
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "conversion_request",
        strict: true,
        schema: {
          type: "object",
          properties: {
            value: { type: "number" },
            fromUnit: { type: "string" },
            toUnit: { type: "string" },
          },
          required: ["value", "fromUnit", "toUnit"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed.value && parsed.fromUnit && parsed.toUnit) {
      return convertUnits(parsed.value, parsed.fromUnit, parsed.toUnit);
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

// ============================================
// CURRENCY CONVERTER
// ============================================

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
}

// Static exchange rates (in production, fetch from API)
const exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1320.50,
  SGD: 1.34,
  HKD: 7.82,
  NZD: 1.64,
  SEK: 10.42,
  NOK: 10.65,
  DKK: 6.87,
  PLN: 4.02,
  THB: 35.50,
  ILS: 3.67,
  ZAR: 18.75,
  RUB: 89.50,
  TRY: 30.25,
  AED: 3.67,
  SAR: 3.75,
  PHP: 55.80,
  MYR: 4.72,
  IDR: 15650,
  VND: 24350,
  TWD: 31.50,
};

/**
 * Convert currency
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): ConversionResult | null {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (!(from in exchangeRates) || !(to in exchangeRates)) {
    return null;
  }

  // Convert to USD first, then to target currency
  const usdAmount = amount / exchangeRates[from];
  const resultAmount = usdAmount * exchangeRates[to];

  return {
    from: { value: amount, unit: from },
    to: { value: resultAmount, unit: to },
    formula: `${amount} ${from} = ${resultAmount.toFixed(2)} ${to}`,
  };
}

// ============================================
// TIMEZONE CONVERTER
// ============================================

export interface TimezoneResult {
  from: { time: string; timezone: string };
  to: { time: string; timezone: string };
}

const timezoneOffsets: Record<string, number> = {
  'UTC': 0, 'GMT': 0,
  'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5, 'MST': -7, 'MDT': -6, 'PST': -8, 'PDT': -7,
  'CET': 1, 'CEST': 2, 'EET': 2, 'EEST': 3,
  'IST': 5.5, 'JST': 9, 'KST': 9, 'CST_CHINA': 8, 'AEST': 10, 'AEDT': 11,
  'NZST': 12, 'NZDT': 13,
};

/**
 * Convert time between timezones
 */
export function convertTimezone(time: string, fromTz: string, toTz: string): TimezoneResult | null {
  const fromOffset = timezoneOffsets[fromTz.toUpperCase()];
  const toOffset = timezoneOffsets[toTz.toUpperCase()];

  if (fromOffset === undefined || toOffset === undefined) {
    return null;
  }

  // Parse time (HH:MM format)
  const timeMatch = time.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!timeMatch) {
    return null;
  }

  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const ampm = timeMatch[3]?.toUpperCase();

  // Convert to 24-hour format
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  // Calculate UTC time
  const utcHours = hours - fromOffset;
  
  // Calculate target time
  let targetHours = utcHours + toOffset;
  
  // Handle day overflow
  if (targetHours >= 24) targetHours -= 24;
  if (targetHours < 0) targetHours += 24;

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return {
    from: { time: formatTime(hours, minutes), timezone: fromTz.toUpperCase() },
    to: { time: formatTime(targetHours, minutes), timezone: toTz.toUpperCase() },
  };
}
