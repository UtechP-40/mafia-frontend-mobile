import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClientCacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum storage size in bytes
  enablePersistence?: boolean;
  compressionEnabled?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  size: number;
  lastAccessed: number;
}

class ClientCache<T = any> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private readonly name: string;
  private readonly options: Required<ClientCacheOptions>;
  private currentSize = 0;

  constructor(name: string, options: ClientCacheOptions = {}) {
    this.name = name;
    this.options = {
      ttl: options.ttl || 300, // 5 minutes default
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      enablePersistence: options.enablePersistence !== false,
      compressionEnabled: options.compressionEnabled || false,
    };

    this.loadFromPersistentStorage();
  }

  private async loadFromPersistentStorage(): Promise<void> {
    if (!this.options.enablePersistence) return;

    try {
      const persistedData = await AsyncStorage.getItem(`cache:${this.name}`);
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        const now = Date.now();

        for (const [key, entry] of Object.entries(parsed)) {
          const cacheEntry = entry as CacheEntry<T>;
          if (cacheEntry.expiry > now) {
            this.memoryCache.set(key, cacheEntry);
            this.currentSize += cacheEntry.size;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load cache ${this.name} from storage:`, error);
    }
  }

  private async persistToStorage(): Promise<void> {
    if (!this.options.enablePersistence) return;

    try {
      const cacheObject = Object.fromEntries(this.memoryCache.entries());
      await AsyncStorage.setItem(`cache:${this.name}`, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn(`Failed to persist cache ${this.name} to storage:`, error);
    }
  }

  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Fallback size estimate
    }
  }

  private evictLRU(): void {
    if (this.memoryCache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
        this.memoryCache.delete(oldestKey);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry < now) {
        keysToDelete.push(key);
        this.currentSize -= entry.size;
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    if (keysToDelete.length > 0) {
      this.persistToStorage();
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const size = this.calculateSize(value);
    const expiry = Date.now() + (ttl || this.options.ttl) * 1000;

    // Check if we need to make space
    while (this.currentSize + size > this.options.maxSize && this.memoryCache.size > 0) {
      this.evictLRU();
    }

    // If the item is still too large, don't cache it
    if (size > this.options.maxSize) {
      console.warn(`Item too large to cache: ${key} (${size} bytes)`);
      return;
    }

    const existingEntry = this.memoryCache.get(key);
    if (existingEntry) {
      this.currentSize -= existingEntry.size;
    }

    const entry: CacheEntry<T> = {
      value,
      expiry,
      size,
      lastAccessed: Date.now(),
    };

    this.memoryCache.set(key, entry);
    this.currentSize += size;

    await this.persistToStorage();
  }

  get(key: string): T | undefined {
    this.cleanup(); // Clean expired entries

    const entry = this.memoryCache.get(key);
    if (!entry) return undefined;

    if (entry.expiry < Date.now()) {
      this.currentSize -= entry.size;
      this.memoryCache.delete(key);
      this.persistToStorage();
      return undefined;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      const deleted = this.memoryCache.delete(key);
      await this.persistToStorage();
      return deleted;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.currentSize = 0;
    
    if (this.options.enablePersistence) {
      await AsyncStorage.removeItem(`cache:${this.name}`);
    }
  }

  getStats() {
    return {
      size: this.memoryCache.size,
      memoryUsage: this.currentSize,
      maxSize: this.options.maxSize,
      utilizationPercent: (this.currentSize / this.options.maxSize) * 100,
    };
  }

  keys(): string[] {
    this.cleanup();
    return Array.from(this.memoryCache.keys());
  }
}

class ClientCacheManager {
  private static instance: ClientCacheManager;
  private caches = new Map<string, ClientCache>();

  static getInstance(): ClientCacheManager {
    if (!ClientCacheManager.instance) {
      ClientCacheManager.instance = new ClientCacheManager();
    }
    return ClientCacheManager.instance;
  }

  createCache<T>(name: string, options: ClientCacheOptions = {}): ClientCache<T> {
    if (this.caches.has(name)) {
      return this.caches.get(name)! as ClientCache<T>;
    }

    const cache = new ClientCache<T>(name, options);
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): ClientCache<T> | undefined {
    return this.caches.get(name) as ClientCache<T> | undefined;
  }

  async clearAllCaches(): Promise<void> {
    const clearPromises = Array.from(this.caches.values()).map(cache => cache.clear());
    await Promise.all(clearPromises);
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

export const clientCacheManager = ClientCacheManager.getInstance();

// Specialized client caches
export const apiCache = clientCacheManager.createCache('api', {
  ttl: 300, // 5 minutes
  maxSize: 5 * 1024 * 1024, // 5MB
  enablePersistence: true,
});

export const imageCache = clientCacheManager.createCache('images', {
  ttl: 3600, // 1 hour
  maxSize: 20 * 1024 * 1024, // 20MB
  enablePersistence: true,
});

export const gameStateCache = clientCacheManager.createCache('gameState', {
  ttl: 60, // 1 minute
  maxSize: 1024 * 1024, // 1MB
  enablePersistence: false, // Game state changes frequently
});

export const userPreferencesCache = clientCacheManager.createCache('userPreferences', {
  ttl: 86400, // 24 hours
  maxSize: 100 * 1024, // 100KB
  enablePersistence: true,
});

// Cache utilities for React components
export const useCachedData = <T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  cacheName: string = 'api',
  ttl?: number
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const cache = clientCacheManager.getCache<T>(cacheName);
    if (!cache) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetchFunction();
        await cache.set(cacheKey, freshData, ttl);
        setData(freshData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cacheKey, cacheName, ttl]);

  const invalidateCache = async () => {
    const cache = clientCacheManager.getCache<T>(cacheName);
    if (cache) {
      await cache.delete(cacheKey);
    }
  };

  return { data, loading, error, invalidateCache };
};

// Cache warming for critical data
export const warmCriticalCaches = async () => {
  try {
    // Warm up user preferences
    const userPrefs = await AsyncStorage.getItem('userPreferences');
    if (userPrefs) {
      await userPreferencesCache.set('current', JSON.parse(userPrefs));
    }

    console.log('Critical caches warmed successfully');
  } catch (error) {
    console.warn('Failed to warm critical caches:', error);
  }
};