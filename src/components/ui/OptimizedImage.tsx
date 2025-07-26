import React, { useState, useCallback, useMemo } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  resize?: 'cover' | 'contain' | 'stretch';
  cachePolicy?: 'memory' | 'disk' | 'none';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  errorPlaceholder,
  lazy = false,
  quality = 'medium',
  resize = 'cover',
  cachePolicy = 'memory',
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);

  // Optimize image source based on quality and screen size
  const optimizedSource = useMemo(() => {
    if (typeof source === 'number') {
      return source;
    }

    const { uri } = source;
    const qualityParams = {
      low: 'q_30,f_auto',
      medium: 'q_60,f_auto',
      high: 'q_90,f_auto',
    };

    // Add optimization parameters if it's a remote image
    if (uri.startsWith('http')) {
      const separator = uri.includes('?') ? '&' : '?';
      const optimizedUri = `${uri}${separator}${qualityParams[quality]}&w_${Math.floor(screenWidth)}`;
      return { uri: optimizedUri };
    }

    return source;
  }, [source, quality]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  const handleLayout = useCallback(() => {
    if (lazy && !isVisible) {
      setIsVisible(true);
    }
  }, [lazy, isVisible]);

  const imageStyle = useMemo(() => [
    styles.image,
    { resizeMode: resize },
    style,
  ] as ImageStyle[], [resize, style]);

  const DefaultPlaceholder = () => (
    <View style={[styles.placeholder, style]}>
      <ActivityIndicator size="small" color="#007AFF" />
    </View>
  );

  const DefaultErrorPlaceholder = () => (
    <View style={[styles.errorPlaceholder, style]}>
      <ActivityIndicator size="small" color="#FF3B30" />
    </View>
  );

  if (lazy && !isVisible) {
    return (
      <View
        style={[styles.lazyContainer, style]}
        onLayout={handleLayout}
      >
        {placeholder || <DefaultPlaceholder />}
      </View>
    );
  }

  if (hasError) {
    return errorPlaceholder || <DefaultErrorPlaceholder />;
  }

  return (
    <View style={styles.container}>
      {isLoading && (placeholder || <DefaultPlaceholder />)}
      <Image
        {...props}
        source={optimizedSource}
        style={[imageStyle, isLoading && styles.hidden]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
    </View>
  );
};

// Image cache management
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache = new Map<string, string>();
  private maxCacheSize = 50; // Maximum number of cached images

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  getCachedImage(uri: string): string | undefined {
    return this.cache.get(uri);
  }

  setCachedImage(uri: string, cachedUri: string): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(uri, cachedUri);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const imageCache = ImageCacheManager.getInstance();

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  lazyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});