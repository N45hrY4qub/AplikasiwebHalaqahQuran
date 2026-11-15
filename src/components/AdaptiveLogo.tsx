import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

interface AdaptiveLogoProps {
  src?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackIcon?: React.ReactNode;
  roundedClassName?: string;
  sizeClassName?: string;
}

/**
 * AdaptiveLogo analyzes the image's background (transparent vs solid/white/colored)
 * and automatically adapts the container frame background to match seamlessly.
 */
export const AdaptiveLogo: React.FC<AdaptiveLogoProps> = ({
  src,
  alt = 'Logo',
  className = '',
  imgClassName = '',
  fallbackIcon,
  roundedClassName = 'rounded-xl',
  sizeClassName = 'w-10 h-10',
}) => {
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [isLight, setIsLight] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setBgColor(null);
      setIsTransparent(true);
      setHasError(false);
      return;
    }

    setHasError(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 32;
        const height = img.naturalHeight || img.height || 32;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsTransparent(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Sample corner & edge pixels
        const samplePoints = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
          [Math.floor(width / 2), 0],
          [0, Math.floor(height / 2)],
          [width - 1, Math.floor(height / 2)],
          [Math.floor(width / 2), height - 1],
        ];

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let totalA = 0;
        let validSamples = 0;

        for (const [x, y] of samplePoints) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          totalR += pixel[0];
          totalG += pixel[1];
          totalB += pixel[2];
          totalA += pixel[3];
          validSamples++;
        }

        const avgA = totalA / validSamples;
        const avgR = Math.round(totalR / validSamples);
        const avgG = Math.round(totalG / validSamples);
        const avgB = Math.round(totalB / validSamples);

        // If average alpha is low (< 25 out of 255), treat as transparent background
        if (avgA < 25) {
          setIsTransparent(true);
          setBgColor(null);
        } else {
          setIsTransparent(false);
          const colorStr = `rgb(${avgR}, ${avgG}, ${avgB})`;
          setBgColor(colorStr);

          // Calculate luminance
          const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
          setIsLight(luminance > 180);
        }
      } catch (err) {
        // Fallback for CORS or canvas errors
        setIsTransparent(true);
      }
    };

    img.onerror = () => {
      setHasError(true);
    };

    img.src = src;
  }, [src]);

  if (!src || hasError) {
    if (fallbackIcon) {
      return <>{fallbackIcon}</>;
    }
    return (
      <div 
        className={`relative flex items-center justify-center ${sizeClassName} ${roundedClassName} bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-md border border-emerald-400/20 ${className}`}
      >
        <BookOpen className="w-1/2 h-1/2 text-white" />
      </div>
    );
  }

  // If transparent (e.g. PNG icon without background)
  if (isTransparent) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClassName} ${className}`}>
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain bg-transparent ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // If solid background (e.g. white background image or colored logo):
  // We apply the sampled background color to the entire rounded frame and pad the image inside!
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden p-1 transition-all duration-300 ${sizeClassName} ${roundedClassName} ${
        isLight
          ? 'shadow-sm border border-slate-200/80 dark:border-white/20'
          : 'shadow-md border border-slate-700/50'
      } ${className}`}
      style={{
        backgroundColor: bgColor || '#ffffff',
      }}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain ${imgClassName}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
