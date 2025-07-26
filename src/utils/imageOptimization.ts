import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  blur?: number;
  grayscale?: boolean;
}

export class ImageOptimizer {
  private static readonly CDN_BASE_URL = 'https://res.cloudinary.com/your-cloud/image/fetch/';
  
  static optimizeImageUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!originalUrl.startsWith('http')) {
      return originalUrl;
    }

    const {
      width = screenWidth * pixelRatio,
      height,
      quality = 80,
      format = 'webp',
      blur,
      grayscale = false,
    } = options;

    const transformations: string[] = [];

    // Add width transformation
    if (width) {
      transformations.push(`w_${Math.floor(width)}`);
    }

    // Add height transformation
    if (height) {
      transformations.push(`h_${Math.floor(height)}`);
    }

    // Add quality transformation
    transformations.push(`q_${quality}`);

    // Add format transformation
    transformations.push(`f_${format}`);

    // Add blur if specified
    if (blur) {
      transformations.push(`e_blur:${blur}`);
    }

    // Add grayscale if specified
    if (grayscale) {
      transformations.push('e_grayscale');
    }

    // Add auto optimization
    transformations.push('f_auto', 'q_auto');

    const transformationString = transformations.join(',');
    return `${this.CDN_BASE_URL}${transformationString}/${encodeURIComponent(originalUrl)}`;
  }

  static getOptimalImageSize(containerWidth: number, containerHeight: number): {
    width: number;
    height: number;
  } {
    const optimalWidth = Math.min(containerWidth * pixelRatio, screenWidth * pixelRatio);
    const optimalHeight = Math.min(containerHeight * pixelRatio, screenHeight * pixelRatio);

    return {
      width: Math.floor(optimalWidth),
      height: Math.floor(optimalHeight),
    };
  }

  static preloadImages(urls: string[]): Promise<void[]> {
    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
        image.src = url;
      });
    });

    return Promise.all(preloadPromises);
  }

  static generatePlaceholder(width: number, height: number, color = '#F2F2F7'): string {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
      </svg>
    `)}`;
  }

  static calculateImageMemoryUsage(width: number, height: number, bytesPerPixel = 4): number {
    return width * height * bytesPerPixel;
  }

  static shouldUseWebP(): boolean {
    // Check if WebP is supported (simplified check)
    return true; // React Native generally supports WebP
  }

  static getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = uri;
    });
  }
}

// Image lazy loading utilities
export class LazyImageLoader {
  private static loadedImages = new Set<string>();
  private static loadingImages = new Map<string, Promise<void>>();

  static async loadImage(uri: string): Promise<void> {
    if (this.loadedImages.has(uri)) {
      return Promise.resolve();
    }

    if (this.loadingImages.has(uri)) {
      return this.loadingImages.get(uri)!;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.loadedImages.add(uri);
        this.loadingImages.delete(uri);
        resolve();
      };
      image.onerror = () => {
        this.loadingImages.delete(uri);
        reject(new Error(`Failed to load image: ${uri}`));
      };
      image.src = uri;
    });

    this.loadingImages.set(uri, loadPromise);
    return loadPromise;
  }

  static isImageLoaded(uri: string): boolean {
    return this.loadedImages.has(uri);
  }

  static clearCache(): void {
    this.loadedImages.clear();
    this.loadingImages.clear();
  }

  static getCacheStats(): { loaded: number; loading: number } {
    return {
      loaded: this.loadedImages.size,
      loading: this.loadingImages.size,
    };
  }
}

// Image compression utilities
export const compressImage = async (
  uri: string,
  quality: number = 0.8
): Promise<string> => {
  // This would typically use a native module for image compression
  // For now, return the original URI
  return uri;
};

export const resizeImage = async (
  uri: string,
  width: number,
  height: number
): Promise<string> => {
  // This would typically use a native module for image resizing
  // For now, return the original URI
  return uri;
};