/**
 * Live Search Detector
 * 
 * Detects queries that require real-time information from the web,
 * such as prices, news, weather, sports scores, stock prices, etc.
 */

// Patterns that indicate a need for real-time information
const REALTIME_PATTERNS = [
  // Prices and financial data
  /\b(price|cost|worth|value)\s+(of|for)\b/i,
  /\b(bitcoin|btc|ethereum|eth|crypto|stock|share|gold|silver|oil)\s*(price|value|worth)/i,
  /\b(how much|what is|what's)\s+(the\s+)?(price|cost|value)\b/i,
  /\$\s*\d+|\d+\s*\$/i, // Dollar amounts
  /\b(market|trading|exchange)\s+(rate|price)/i,
  
  // Current events and news
  /\b(today|tonight|this week|this month|right now|currently|latest|recent|breaking)\b/i,
  /\b(news|headlines|update|updates|happening)\b/i,
  /\bwhat('s| is| are)\s+(happening|going on|new)\b/i,
  
  // Weather
  /\b(weather|forecast|temperature|rain|snow|sunny|cloudy)\s+(in|for|at|today|tomorrow|this week)/i,
  /\bweather\b/i,
  
  // Sports scores and results
  /\b(score|result|won|lost|winning|game|match)\s+(of|for|between)/i,
  /\b(nba|nfl|mlb|nhl|premier league|champions league|world cup)\b/i,
  /\bwho\s+(won|is winning|scored)/i,
  
  // Time-sensitive queries
  /\b(open|closed|hours|schedule)\s+(today|now|right now)/i,
  /\bis\s+.+\s+(open|closed|available)\b/i,
  
  // Current status queries
  /\b(status|state)\s+of\b/i,
  /\bwhat\s+time\s+(is|does)\b/i,
  /\bcurrent(ly)?\b/i,
  
  // Specific real-time data requests
  /\b(exchange rate|conversion rate|forex)\b/i,
  /\b(traffic|flight|train)\s+(status|delay|schedule)/i,
  /\b(covid|coronavirus|pandemic)\s+(cases|numbers|statistics)/i,
  
  // "Today" variations
  /\btoday's\b/i,
  /\bthis\s+(morning|afternoon|evening|week|month|year)\b/i,
  
  // Explicit time references
  /\b(2024|2025|2026)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
];

// Patterns that indicate the user does NOT need real-time search
// (general knowledge, how-to, definitions, etc.)
const NON_REALTIME_PATTERNS = [
  /\bhow\s+to\s+(make|create|build|do|write|code|cook|fix)/i,
  /\bwhat\s+is\s+(a|an|the)\s+\w+\??\s*$/i, // Simple definitions
  /\bexplain\s+(to me|how|what|why)/i,
  /\bwrite\s+(me\s+)?(a|an)\s+(story|poem|essay|code|script)/i,
  /\btell\s+me\s+(about|a\s+joke|a\s+story)/i,
  /\bhelp\s+me\s+(with|understand|learn)/i,
  /\bcan\s+you\s+(help|explain|write|create)/i,
  /\bgenerate\s+(a|an|the|some)/i,
  /\b(translate|summarize|paraphrase)\b/i,
];

// Keywords that strongly indicate real-time data is needed
const REALTIME_KEYWORDS = [
  'price', 'cost', 'worth', 'value', 'rate',
  'today', 'tonight', 'now', 'current', 'currently', 'latest', 'recent',
  'news', 'update', 'breaking', 'live',
  'weather', 'forecast', 'temperature',
  'score', 'result', 'won', 'lost', 'winning',
  'stock', 'bitcoin', 'crypto', 'ethereum', 'gold', 'silver',
  'market', 'trading', 'exchange',
  'happening', 'going on',
];

// Financial/commodity keywords that almost always need real-time data
const FINANCIAL_KEYWORDS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
  'stock', 'share', 'nasdaq', 'dow', 's&p', 'nyse',
  'gold', 'silver', 'oil', 'gas', 'commodity',
  'forex', 'usd', 'eur', 'gbp', 'jpy', 'cny',
  'price', 'market cap', 'trading', 'exchange rate',
];

/**
 * Detect if a query needs real-time information from the web
 */
export function needsRealtimeSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // First, check if it's clearly NOT a real-time query
  for (const pattern of NON_REALTIME_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      // But still check for financial keywords which override
      const hasFinancialKeyword = FINANCIAL_KEYWORDS.some(kw => lowerQuery.includes(kw));
      if (!hasFinancialKeyword) {
        return false;
      }
    }
  }
  
  // Check for real-time patterns
  for (const pattern of REALTIME_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      return true;
    }
  }
  
  // Check for real-time keywords
  const keywordCount = REALTIME_KEYWORDS.filter(kw => lowerQuery.includes(kw)).length;
  if (keywordCount >= 1) {
    return true;
  }
  
  // Check for financial keywords (high priority)
  const hasFinancialKeyword = FINANCIAL_KEYWORDS.some(kw => lowerQuery.includes(kw));
  if (hasFinancialKeyword) {
    return true;
  }
  
  return false;
}

/**
 * Get the search query to use for real-time search
 * Extracts the most relevant part of the user's question
 */
export function extractSearchQuery(query: string): string {
  // Remove common question prefixes
  let searchQuery = query
    .replace(/^(what('s| is| are| was| were)?|how (much|many)|tell me (about)?|can you (tell me|find|search)|please|could you)\s*/i, '')
    .replace(/\?+$/, '')
    .trim();
  
  // If the query is too short after cleaning, use the original
  if (searchQuery.length < 5) {
    searchQuery = query.replace(/\?+$/, '').trim();
  }
  
  // Add "current" or "today" if it's a price query without time context
  const lowerQuery = searchQuery.toLowerCase();
  if (
    (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('worth')) &&
    !lowerQuery.includes('today') &&
    !lowerQuery.includes('current') &&
    !lowerQuery.includes('now')
  ) {
    searchQuery = searchQuery + ' today';
  }
  
  return searchQuery;
}

/**
 * Determine the type of real-time query for better search handling
 */
export function getRealtimeQueryType(query: string): 'price' | 'news' | 'weather' | 'sports' | 'general' {
  const lowerQuery = query.toLowerCase();
  
  // Price/financial queries
  if (
    FINANCIAL_KEYWORDS.some(kw => lowerQuery.includes(kw)) ||
    /\b(price|cost|worth|value|rate)\b/i.test(lowerQuery)
  ) {
    return 'price';
  }
  
  // Weather queries
  if (/\b(weather|forecast|temperature|rain|snow|sunny|cloudy)\b/i.test(lowerQuery)) {
    return 'weather';
  }
  
  // Sports queries
  if (
    /\b(score|result|won|lost|winning|game|match)\b/i.test(lowerQuery) ||
    /\b(nba|nfl|mlb|nhl|premier league|champions league|world cup)\b/i.test(lowerQuery)
  ) {
    return 'sports';
  }
  
  // News queries
  if (/\b(news|headlines|update|updates|happening|breaking)\b/i.test(lowerQuery)) {
    return 'news';
  }
  
  return 'general';
}
