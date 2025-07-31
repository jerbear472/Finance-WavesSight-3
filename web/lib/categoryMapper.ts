// Category mapper to convert frontend display values to database enum values

// Map of frontend display values to database enum values
// Database enum values: 'stocks_companies', 'crypto_defi', 'startups_ipos', 'fintech_apps', 'consumer_retail', 'restaurants_chains', 'gaming_entertainment'
export const CATEGORY_MAP: Record<string, string> = {
  // Finance-focused frontend -> Database mappings
  'Stocks & Public Companies': 'stocks_companies',
  'Cryptocurrency & DeFi': 'crypto_defi',
  'Startups & IPOs': 'startups_ipos',
  'Fintech & Trading Apps': 'fintech_apps',
  'Consumer Products': 'consumer_retail',
  'Restaurants & Retail Chains': 'restaurants_chains',
  'Gaming & Entertainment Stocks': 'gaming_entertainment',
  'Real Estate & REITs': 'stocks_companies',
  'Commodities & Resources': 'stocks_companies',
  'Financial Services': 'fintech_apps',
  'Luxury': 'consumer_retail',
  'Celebrity': 'stocks_companies',
  'Meme Coin': 'crypto_defi',
  'Meme Stock': 'stocks_companies',
  // Direct mappings for database values
  'stocks_companies': 'stocks_companies',
  'crypto_defi': 'crypto_defi',
  'startups_ipos': 'startups_ipos',
  'fintech_apps': 'fintech_apps',
  'consumer_retail': 'consumer_retail',
  'restaurants_chains': 'restaurants_chains',
  'gaming_entertainment': 'gaming_entertainment',
  // Legacy mappings (for backward compatibility)
  'visual_style': 'stocks_companies',
  'audio_music': 'gaming_entertainment',
  'creator_technique': 'fintech_apps',
  'meme_format': 'stocks_companies',
  'product_brand': 'consumer_retail',
  'behavior_pattern': 'stocks_companies'
};

/**
 * Convert a frontend category display value to database enum value
 * @param displayCategory - The category as shown in the UI (e.g., "Humor & Memes")
 * @returns The database-friendly enum value (e.g., "humor_memes")
 */
export function mapCategoryToEnum(displayCategory: string): string {
  // First check if there's an explicit mapping
  if (CATEGORY_MAP[displayCategory]) {
    return CATEGORY_MAP[displayCategory];
  }
  
  // Fallback: convert to database-friendly format
  return displayCategory
    .toLowerCase()
    .replace(/\s*&\s*/g, '_')  // Replace & with underscore
    .replace(/\s+/g, '_')       // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '') // Remove any other special characters
    .replace(/_+/g, '_')        // Remove duplicate underscores
    .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
}

/**
 * Convert multiple categories
 * @param categories - Array of display categories
 * @returns Array of database enum values
 */
export function mapCategoriesToEnum(categories: string[]): string[] {
  return categories.map(cat => mapCategoryToEnum(cat));
}

// Reverse mapping for displaying database values in UI
export const CATEGORY_DISPLAY_MAP: Record<string, string> = Object.entries(CATEGORY_MAP).reduce(
  (acc, [display, db]) => ({ ...acc, [db]: display }),
  {}
);

/**
 * Convert database enum value back to display value
 * @param enumValue - The database enum value (e.g., "humor_memes")
 * @returns The display value (e.g., "Humor & Memes")
 */
export function mapEnumToDisplay(enumValue: string): string {
  return CATEGORY_DISPLAY_MAP[enumValue] || enumValue;
}