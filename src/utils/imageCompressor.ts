/**
 * Utility to compress and resize base64 images dynamically to stay within limits.
 */

/**
 * Resizes and compresses a base64 string representing an image.
 * Uses HTML5 Canvas for super fast, client-side, dependency-free processing.
 * Defaults to 200x200px and 0.7 quality for profile pictures (~15KB).
 */
export function compressBase64Image(
  base64Str: string,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a valid base64 image data URL, return original
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const isTransparentFormat = base64Str.includes('image/png') || 
                                     base64Str.includes('image/svg+xml') || 
                                     base64Str.includes('image/webp') || 
                                     base64Str.includes('image/gif');
        const outputFormat = isTransparentFormat ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(outputFormat, outputFormat === 'image/jpeg' ? quality : undefined);
        resolve(compressed);
      } catch (err) {
        // Fallback to original on error
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}

/**
 * Helper to compress user profiles or any other objects before they get stored
 * in Firestore. If the fotoProfil contains a heavy base64 string, this will compress it.
 */
export async function sanitizeProfileFields<T extends { fotoProfil?: string }>(item: T): Promise<T> {
  if (item.fotoProfil && item.fotoProfil.startsWith('data:image')) {
    try {
      const compressed = await compressBase64Image(item.fotoProfil, 200, 200, 0.7);
      return {
        ...item,
        fotoProfil: compressed,
      };
    } catch {
      return item;
    }
  }
  return item;
}
