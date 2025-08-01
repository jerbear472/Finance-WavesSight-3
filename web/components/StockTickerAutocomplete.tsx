'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, DollarSign, Hash } from 'lucide-react';
import { searchStocks, getTrendingStocks, StockData } from '@/lib/stockTickerData';

interface StockTickerAutocompleteProps {
  value: string;
  onSelect: (symbol: string, name: string) => void;
  placeholder?: string;
  showTrending?: boolean;
  type?: 'symbol' | 'name' | 'both';
  className?: string;
}

export default function StockTickerAutocomplete({
  value,
  onSelect,
  placeholder = 'Search stocks, crypto, or ETFs...',
  showTrending = true,
  type = 'both',
  className = ''
}: StockTickerAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<StockData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [trending, setTrending] = useState<StockData[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load trending stocks on mount
  useEffect(() => {
    if (showTrending) {
      setTrending(getTrendingStocks(undefined, 6));
    }
  }, [showTrending]);
  
  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Search for stocks
  useEffect(() => {
    if (inputValue.length > 0) {
      const results = searchStocks(inputValue);
      setSuggestions(results);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowDropdown(showTrending && trending.length > 0);
    }
  }, [inputValue, showTrending, trending]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // If typing a symbol, auto-uppercase
    if (type === 'symbol' && newValue.length <= 5 && /^[A-Za-z]*$/.test(newValue)) {
      setInputValue(newValue.toUpperCase());
    }
  };
  
  const handleSelect = (stock: StockData) => {
    if (type === 'symbol') {
      setInputValue(stock.symbol);
      onSelect(stock.symbol, stock.name);
    } else if (type === 'name') {
      setInputValue(stock.name);
      onSelect(stock.symbol, stock.name);
    } else {
      // For 'both', let parent decide what to do
      onSelect(stock.symbol, stock.name);
    }
    setShowDropdown(false);
    setSelectedIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : (showTrending ? trending : []);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  const getStockIcon = (stock: StockData) => {
    switch (stock.type) {
      case 'crypto':
        return <Hash className="w-4 h-4 text-orange-400" />;
      case 'etf':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-green-400" />;
    }
  };
  
  const getStockTypeLabel = (type: string) => {
    switch (type) {
      case 'crypto':
        return 'Crypto';
      case 'etf':
        return 'ETF';
      default:
        return 'Stock';
    }
  };
  
  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-wave-800/50 border border-wave-700/30 text-white placeholder-wave-500 focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20 ${className}`}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wave-400" />
      </div>
      
      <AnimatePresence>
        {showDropdown && (suggestions.length > 0 || (showTrending && trending.length > 0 && !inputValue)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-wave-900 border border-wave-700/50 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Search Results */}
            {suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-xs text-wave-400 font-medium">Search Results</div>
                {suggestions.map((stock, index) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-wave-800/50 transition-all ${
                      selectedIndex === index ? 'bg-wave-800/50' : ''
                    }`}
                  >
                    {getStockIcon(stock)}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{stock.symbol}</span>
                        <span className="text-xs text-wave-500">{getStockTypeLabel(stock.type)}</span>
                      </div>
                      <div className="text-sm text-wave-400 truncate">{stock.name}</div>
                    </div>
                    {stock.sector && (
                      <span className="text-xs text-wave-600">{stock.sector}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* Trending Section */}
            {showTrending && trending.length > 0 && !inputValue && (
              <div className="py-2 border-t border-wave-800">
                <div className="px-3 py-1 text-xs text-wave-400 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending Now
                </div>
                {trending.map((stock, index) => {
                  const adjustedIndex = suggestions.length + index;
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock)}
                      onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-wave-800/50 transition-all ${
                        selectedIndex === adjustedIndex ? 'bg-wave-800/50' : ''
                      }`}
                    >
                      {getStockIcon(stock)}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{stock.symbol}</span>
                          <span className="text-xs text-wave-500">{getStockTypeLabel(stock.type)}</span>
                        </div>
                        <div className="text-sm text-wave-400 truncate">{stock.name}</div>
                      </div>
                      {stock.popularity && stock.popularity >= 9 && (
                        <span className="text-xs text-orange-400">🔥 Hot</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}