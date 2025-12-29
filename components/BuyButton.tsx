'use client';

import { ShoppingBag } from 'lucide-react';

interface BuyButtonProps {
  isbn: string;
  className?: string;
}

export function BuyButton({ isbn, className = '' }: BuyButtonProps) {
  // YOUR AMAZON AFFILIATE ID
  const AFFILIATE_ID = 'subtext-22'; 
  
  // Amazon AU Search Link
  const buyUrl = `https://www.amazon.com.au/s?k=${isbn}&tag=${AFFILIATE_ID}`;

  return (
    <a
      href={buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2 px-6 py-2 
        bg-primary text-primary-foreground font-bold rounded-full 
        hover:bg-primary/90 transition-colors shadow-lg hover:scale-105 transform duration-200
        ${className}
      `}
    >
      <ShoppingBag className="w-4 h-4" />
      <span>Buy on Amazon AU</span>
    </a>
  );
}