/**
 * Financial Data Provider
 * Provides real-time financial data including stock prices, commodities, crypto, etc.
 * Uses Yahoo Finance API for live data
 */

export interface FinancialDataResult {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  exchange: string;
  lastUpdated: Date;
  dayHigh?: number;
  dayLow?: number;
  change?: number;
  changePercent?: number;
  historicalData?: Array<{
    date: string;
    price: number;
  }>;
}

// Common financial symbols
const SYMBOL_MAP: Record<string, string> = {
  // Precious Metals
  'silver': 'SI=F',
  'gold': 'GC=F',
  'platinum': 'PL=F',
  'palladium': 'PA=F',
  'copper': 'HG=F',
  
  // Cryptocurrencies
  'bitcoin': 'BTC-USD',
  'ethereum': 'ETH-USD',
  'btc': 'BTC-USD',
  'eth': 'ETH-USD',
  
  // Commodities
  'crude oil': 'CL=F',
  'oil': 'CL=F',
  'natural gas': 'NG=F',
  'wheat': 'ZW=F',
  'corn': 'ZC=F',
  'soybeans': 'ZS=F',
  
  // Indices
  'sp500': '^GSPC',
  's&p 500': '^GSPC',
  'dow jones': '^DJI',
  'nasdaq': '^IXIC',
  'russell 2000': '^RUT',
};

/**
 * Detect if a query is asking for financial data
 */
export function isFinancialQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Financial keywords
  const financialKeywords = [
    'price', 'cost', 'value', 'worth',
    'stock', 'share', 'equity',
    'commodity', 'futures',
    'crypto', 'cryptocurrency', 'coin',
    'trading', 'market', 'exchange',
    'silver', 'gold', 'platinum', 'metal',
    'bitcoin', 'ethereum', 'btc', 'eth',
    'oil', 'gas', 'wheat', 'corn',
  ];
  
  // Check if query contains financial keywords
  return financialKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Extract symbol from query
 */
export function extractSymbol(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  // Check symbol map
  for (const [key, symbol] of Object.entries(SYMBOL_MAP)) {
    if (lowerQuery.includes(key)) {
      return symbol;
    }
  }
  
  // Check for direct symbol mention (e.g., "AAPL stock price")
  const symbolMatch = query.match(/\b([A-Z]{1,5})\b/);
  if (symbolMatch) {
    return symbolMatch[1];
  }
  
  return null;
}

/**
 * Fetch real-time financial data from Yahoo Finance
 */
export async function getFinancialData(
  query: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '6mo'
): Promise<FinancialDataResult | null> {
  try {
    const symbol = extractSymbol(query);
    if (!symbol) {
      return null;
    }
    
    // Use Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const params = new URLSearchParams({
      range,
      interval: '1d',
      includeAdjustedClose: 'true',
    });
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return null;
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    // Build historical data
    const historicalData = timestamps
      .map((timestamp: number, index: number) => {
        const price = quotes.close?.[index];
        if (!price) return null;
        
        return {
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: Math.round(price * 100) / 100,
        };
      })
      .filter((item: any) => item !== null);
    
    // Calculate change
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = previousClose ? currentPrice - previousClose : undefined;
    const changePercent = previousClose ? ((change! / previousClose) * 100) : undefined;
    
    return {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      price: Math.round(currentPrice * 100) / 100,
      currency: meta.currency,
      exchange: meta.exchangeName,
      lastUpdated: new Date(meta.regularMarketTime * 1000),
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      change: change ? Math.round(change * 100) / 100 : undefined,
      changePercent: changePercent ? Math.round(changePercent * 100) / 100 : undefined,
      historicalData,
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return null;
  }
}

/**
 * Format financial data for AI response
 */
export function formatFinancialData(data: FinancialDataResult): string {
  let formatted = `**${data.name} (${data.symbol})**\n\n`;
  formatted += `**Current Price:** ${data.currency} ${data.price.toLocaleString()}\n`;
  formatted += `**Exchange:** ${data.exchange}\n`;
  formatted += `**Last Updated:** ${data.lastUpdated.toLocaleString()}\n\n`;
  
  if (data.dayHigh && data.dayLow) {
    formatted += `**Today's Range:** ${data.currency} ${data.dayLow.toLocaleString()} - ${data.dayHigh.toLocaleString()}\n`;
  }
  
  if (data.change !== undefined && data.changePercent !== undefined) {
    const changeSign = data.change >= 0 ? '+' : '';
    formatted += `**Change:** ${changeSign}${data.change.toLocaleString()} (${changeSign}${data.changePercent.toFixed(2)}%)\n`;
  }
  
  if (data.historicalData && data.historicalData.length > 0) {
    formatted += `\n**Historical Data (Last ${data.historicalData.length} days):**\n\n`;
    formatted += `| Date | Price (${data.currency}) |\n`;
    formatted += `|------|----------|\n`;
    
    // Show every 30 days for 6mo range, or all for shorter ranges
    const step = data.historicalData.length > 30 ? Math.floor(data.historicalData.length / 6) : 1;
    
    for (let i = 0; i < data.historicalData.length; i += step) {
      const item = data.historicalData[i];
      formatted += `| ${item.date} | ${item.price.toLocaleString()} |\n`;
    }
    
    // Always include the last day
    const lastItem = data.historicalData[data.historicalData.length - 1];
    if (data.historicalData.length > 1) {
      formatted += `| ${lastItem.date} | ${lastItem.price.toLocaleString()} | (Latest)\n`;
    }
  }
  
  return formatted;
}
