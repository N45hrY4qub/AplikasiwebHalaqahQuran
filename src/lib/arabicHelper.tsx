/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Helper function to format and isolate Arabic words with high-quality fallback web fonts.
 * This prevents tofu blocks and overlapping characters on older Android devices.
 */
export const renderArabicEnhancedText = (text: string | null | undefined): React.ReactNode => {
  if (!text) return '';
  
  // Regex to match Arabic words/phrases (including harakat, numbers, punctuation and spaces between Arabic words)
  const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]+(?:\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]+)*)/g;
  
  const parts = text.split(arabicRegex);
  return (
    <>
      {parts.map((part, index) => {
        if (arabicRegex.test(part)) {
          return (
            <span 
              key={index} 
              className="font-mushaf font-normal text-[15px] leading-relaxed inline-block select-all" 
              style={{ 
                fontFamily: "var(--font-arabic, 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', 'Scheherazade New', 'Lateef', serif)",
                direction: 'rtl',
                unicodeBidi: 'embed',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                padding: '0 2px'
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};
