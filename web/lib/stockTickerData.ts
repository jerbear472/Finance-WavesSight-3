// Popular stocks and companies for autocomplete
export interface StockData {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf';
  sector?: string;
  popularity?: number; // 1-10 scale for sorting
}

export const POPULAR_STOCKS: StockData[] = [
  // Top Tech Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', sector: 'Technology', popularity: 10 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', sector: 'Technology', popularity: 10 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', sector: 'Technology', popularity: 10 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', sector: 'Consumer Cyclical', popularity: 10 },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', sector: 'Technology', popularity: 9 },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', sector: 'Consumer Cyclical', popularity: 10 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', sector: 'Technology', popularity: 10 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', sector: 'Technology', popularity: 8 },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'stock', sector: 'Technology', popularity: 7 },
  
  // Meme Stocks
  { symbol: 'GME', name: 'GameStop Corp.', type: 'stock', sector: 'Consumer Cyclical', popularity: 10 },
  { symbol: 'AMC', name: 'AMC Entertainment', type: 'stock', sector: 'Entertainment', popularity: 9 },
  { symbol: 'BB', name: 'BlackBerry Limited', type: 'stock', sector: 'Technology', popularity: 7 },
  { symbol: 'BBBY', name: 'Bed Bath & Beyond', type: 'stock', sector: 'Retail', popularity: 7 },
  { symbol: 'NOK', name: 'Nokia Corporation', type: 'stock', sector: 'Technology', popularity: 6 },
  
  // Popular Crypto
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', popularity: 10 },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', popularity: 10 },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', popularity: 9 },
  { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', popularity: 8 },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', popularity: 7 },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', popularity: 9 },
  { symbol: 'SHIB', name: 'Shiba Inu', type: 'crypto', popularity: 8 },
  { symbol: 'MATIC', name: 'Polygon', type: 'crypto', popularity: 7 },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', popularity: 6 },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', popularity: 6 },
  { symbol: 'UNI', name: 'Uniswap', type: 'crypto', popularity: 5 },
  { symbol: 'PEPE', name: 'Pepe', type: 'crypto', popularity: 8 },
  
  // Financial Sector
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', sector: 'Financial', popularity: 8 },
  { symbol: 'BAC', name: 'Bank of America', type: 'stock', sector: 'Financial', popularity: 7 },
  { symbol: 'WFC', name: 'Wells Fargo', type: 'stock', sector: 'Financial', popularity: 6 },
  { symbol: 'GS', name: 'Goldman Sachs', type: 'stock', sector: 'Financial', popularity: 7 },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'stock', sector: 'Financial', popularity: 6 },
  { symbol: 'C', name: 'Citigroup', type: 'stock', sector: 'Financial', popularity: 6 },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', sector: 'Financial', popularity: 8 },
  { symbol: 'MA', name: 'Mastercard', type: 'stock', sector: 'Financial', popularity: 7 },
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'stock', sector: 'Financial', popularity: 8 },
  { symbol: 'SQ', name: 'Block Inc. (Square)', type: 'stock', sector: 'Financial', popularity: 7 },
  { symbol: 'COIN', name: 'Coinbase', type: 'stock', sector: 'Financial', popularity: 8 },
  
  // Consumer Brands
  { symbol: 'DIS', name: 'Walt Disney', type: 'stock', sector: 'Entertainment', popularity: 8 },
  { symbol: 'NFLX', name: 'Netflix', type: 'stock', sector: 'Entertainment', popularity: 9 },
  { symbol: 'SBUX', name: 'Starbucks', type: 'stock', sector: 'Consumer Cyclical', popularity: 7 },
  { symbol: 'MCD', name: "McDonald's", type: 'stock', sector: 'Consumer Cyclical', popularity: 7 },
  { symbol: 'NKE', name: 'Nike', type: 'stock', sector: 'Consumer Cyclical', popularity: 8 },
  { symbol: 'LULU', name: 'Lululemon', type: 'stock', sector: 'Consumer Cyclical', popularity: 8 },
  { symbol: 'CMG', name: 'Chipotle', type: 'stock', sector: 'Consumer Cyclical', popularity: 7 },
  { symbol: 'COST', name: 'Costco', type: 'stock', sector: 'Consumer Defensive', popularity: 7 },
  { symbol: 'WMT', name: 'Walmart', type: 'stock', sector: 'Consumer Defensive', popularity: 7 },
  { symbol: 'TGT', name: 'Target', type: 'stock', sector: 'Consumer Defensive', popularity: 6 },
  
  // EV & Energy
  { symbol: 'RIVN', name: 'Rivian', type: 'stock', sector: 'Consumer Cyclical', popularity: 8 },
  { symbol: 'LCID', name: 'Lucid Motors', type: 'stock', sector: 'Consumer Cyclical', popularity: 7 },
  { symbol: 'F', name: 'Ford Motor', type: 'stock', sector: 'Consumer Cyclical', popularity: 6 },
  { symbol: 'GM', name: 'General Motors', type: 'stock', sector: 'Consumer Cyclical', popularity: 6 },
  { symbol: 'NIO', name: 'NIO Inc.', type: 'stock', sector: 'Consumer Cyclical', popularity: 7 },
  { symbol: 'XOM', name: 'Exxon Mobil', type: 'stock', sector: 'Energy', popularity: 6 },
  { symbol: 'CVX', name: 'Chevron', type: 'stock', sector: 'Energy', popularity: 5 },
  
  // Pharma & Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', sector: 'Healthcare', popularity: 6 },
  { symbol: 'PFE', name: 'Pfizer', type: 'stock', sector: 'Healthcare', popularity: 7 },
  { symbol: 'MRNA', name: 'Moderna', type: 'stock', sector: 'Healthcare', popularity: 7 },
  { symbol: 'ABBV', name: 'AbbVie', type: 'stock', sector: 'Healthcare', popularity: 5 },
  { symbol: 'UNH', name: 'UnitedHealth', type: 'stock', sector: 'Healthcare', popularity: 5 },
  
  // Gaming & Social
  { symbol: 'RBLX', name: 'Roblox', type: 'stock', sector: 'Gaming', popularity: 8 },
  { symbol: 'EA', name: 'Electronic Arts', type: 'stock', sector: 'Gaming', popularity: 6 },
  { symbol: 'ATVI', name: 'Activision Blizzard', type: 'stock', sector: 'Gaming', popularity: 7 },
  { symbol: 'SNAP', name: 'Snap Inc.', type: 'stock', sector: 'Technology', popularity: 7 },
  { symbol: 'PINS', name: 'Pinterest', type: 'stock', sector: 'Technology', popularity: 6 },
  
  // Popular ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', popularity: 10 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', popularity: 9 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', popularity: 8 },
  { symbol: 'IWM', name: 'iShares Russell 2000', type: 'etf', popularity: 7 },
  { symbol: 'DIA', name: 'SPDR Dow Jones', type: 'etf', popularity: 6 },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'etf', popularity: 8 },
  { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ', type: 'etf', popularity: 7 },
  { symbol: 'SQQQ', name: 'ProShares UltraPro Short QQQ', type: 'etf', popularity: 7 },
  
  // Airlines & Travel
  { symbol: 'AAL', name: 'American Airlines', type: 'stock', sector: 'Industrials', popularity: 5 },
  { symbol: 'DAL', name: 'Delta Air Lines', type: 'stock', sector: 'Industrials', popularity: 5 },
  { symbol: 'UAL', name: 'United Airlines', type: 'stock', sector: 'Industrials', popularity: 5 },
  { symbol: 'LUV', name: 'Southwest Airlines', type: 'stock', sector: 'Industrials', popularity: 5 },
  { symbol: 'ABNB', name: 'Airbnb', type: 'stock', sector: 'Consumer Cyclical', popularity: 8 },
  { symbol: 'UBER', name: 'Uber', type: 'stock', sector: 'Technology', popularity: 8 },
  { symbol: 'LYFT', name: 'Lyft', type: 'stock', sector: 'Technology', popularity: 6 },
  
  // Retail & E-commerce
  { symbol: 'SHOP', name: 'Shopify', type: 'stock', sector: 'Technology', popularity: 7 },
  { symbol: 'ETSY', name: 'Etsy', type: 'stock', sector: 'Consumer Cyclical', popularity: 6 },
  { symbol: 'W', name: 'Wayfair', type: 'stock', sector: 'Consumer Cyclical', popularity: 5 },
  { symbol: 'CHWY', name: 'Chewy', type: 'stock', sector: 'Consumer Cyclical', popularity: 6 },
  { symbol: 'CVS', name: 'CVS Health', type: 'stock', sector: 'Healthcare', popularity: 5 },
  { symbol: 'WBA', name: 'Walgreens Boots', type: 'stock', sector: 'Healthcare', popularity: 5 }
];

// Function to search stocks
export function searchStocks(query: string, limit: number = 10): StockData[] {
  if (!query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase();
  
  // Search by symbol or name
  const results = POPULAR_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) ||
    stock.name.toLowerCase().includes(searchTerm)
  );
  
  // Sort by popularity and relevance
  results.sort((a, b) => {
    // Exact symbol match gets highest priority
    if (a.symbol.toLowerCase() === searchTerm) return -1;
    if (b.symbol.toLowerCase() === searchTerm) return 1;
    
    // Symbol starts with search term
    if (a.symbol.toLowerCase().startsWith(searchTerm) && !b.symbol.toLowerCase().startsWith(searchTerm)) return -1;
    if (!a.symbol.toLowerCase().startsWith(searchTerm) && b.symbol.toLowerCase().startsWith(searchTerm)) return 1;
    
    // Sort by popularity
    return (b.popularity || 0) - (a.popularity || 0);
  });
  
  return results.slice(0, limit);
}

// Function to get stock by symbol
export function getStockBySymbol(symbol: string): StockData | undefined {
  return POPULAR_STOCKS.find(stock => stock.symbol.toUpperCase() === symbol.toUpperCase());
}

// Function to get trending stocks (for suggestions)
export function getTrendingStocks(type?: 'stock' | 'crypto' | 'etf', limit: number = 10): StockData[] {
  let stocks = POPULAR_STOCKS;
  
  if (type) {
    stocks = stocks.filter(stock => stock.type === type);
  }
  
  // Filter by high popularity and return random selection
  const trending = stocks.filter(stock => (stock.popularity || 0) >= 7);
  
  // Shuffle and return limited results
  return trending
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}