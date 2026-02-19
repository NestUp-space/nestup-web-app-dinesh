/**
 * Laminate Texture Service
 * Port of Apps Script LaminateTextureCache (lines 17964-18053)
 * 
 * Handles loading laminate textures from Google Drive URLs
 * with caching for performance.
 * 
 * CORS SOLUTION: Uses image proxy services to bypass CORS restrictions
 * when loading textures from Google Drive for Three.js
 */

import * as THREE from 'three';

// ============================================
// CORS PROXY CONFIGURATION
// ============================================

/**
 * CORS proxy services (in order of preference)
 * These services proxy images and add proper CORS headers
 */
const CORS_PROXIES = [
  // wsrv.nl (images.weserv.nl) - fast, reliable image proxy
  (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1024&output=jpg&q=85`,
  // corsproxy.io - general CORS proxy
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // No proxy (direct URL) as last resort
  (url: string) => url,
];

// ============================================
// URL CONVERSION
// ============================================

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // https://drive.google.com/file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,               // https://drive.google.com/open?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/,                 // https://drive.google.com/d/FILE_ID
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/, // lh3.googleusercontent.com format
    /thumbnail\?id=([a-zA-Z0-9_-]+)/,        // Already a thumbnail URL
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Try to extract any file ID-like string (25+ chars, alphanumeric with - and _)
  const fileIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
  return fileIdMatch ? fileIdMatch[1] : null;
}

/**
 * Convert Google Drive sharing URL to direct image URL for texture loading
 * Uses thumbnail API with larger size for better texture quality
 * 
 * @param driveUrl - Google Drive URL (various formats supported)
 * @returns Direct thumbnail URL for texture loading
 */
export function convertDriveUrl(driveUrl: string): string {
  if (!driveUrl) return '';
  
  // Already a direct URL (not Google Drive) - return as-is
  if (!driveUrl.includes('drive.google.com') && !driveUrl.includes('googleusercontent')) {
    return driveUrl;
  }
  
  // Extract file ID
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) {
    return driveUrl;
  }
  
  // Use thumbnail API with large size for better texture quality
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1024`;
}

/**
 * Get Google Drive direct download URL (for CORS proxy)
 */
function getDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Get Google Drive thumbnail URL at specified size
 */
function getDriveThumbnailUrl(fileId: string, size: number = 1024): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

// ============================================
// TEXTURE CACHE
// ============================================

/**
 * LaminateTextureCache - Manages Three.js textures for laminates
 * 
 * Features:
 * - Memory caching of loaded textures
 * - URL fallback chain (thumbnail → direct → original)
 * - Proper texture configuration for tiling
 * - Cross-origin support for Google Drive images
 */
class LaminateTextureCacheClass {
  private textures: Map<string, THREE.Texture> = new Map();
  private loader: THREE.TextureLoader | null = null;
  private loadingPromises: Map<string, Promise<THREE.Texture | null>> = new Map();

  /**
   * Get or create the TextureLoader instance
   */
  private getLoader(): THREE.TextureLoader {
    if (!this.loader) {
      this.loader = new THREE.TextureLoader();
      this.loader.crossOrigin = 'anonymous';
    }
    return this.loader;
  }

  /**
   * Load a laminate texture by code and photo URL
   * Returns cached texture if available, otherwise loads from URL
   */
  async loadTexture(code: string, photoUrl: string): Promise<THREE.Texture | null> {
    // Check memory cache first
    if (this.textures.has(code)) {
      return this.textures.get(code)!;
    }

    if (!photoUrl) {
      console.warn('[LaminateTexture] No photo URL for', code);
      return null;
    }

    // Check if already loading
    if (this.loadingPromises.has(code)) {
      return this.loadingPromises.get(code)!;
    }

    // Start loading
    const loadPromise = this._loadTextureInternal(code, photoUrl);
    this.loadingPromises.set(code, loadPromise);

    try {
      const texture = await loadPromise;
      return texture;
    } finally {
      this.loadingPromises.delete(code);
    }
  }

  /**
   * Internal texture loading with CORS proxy fallback chain
   * Uses proxy services to bypass CORS restrictions from Google Drive
   */
  private async _loadTextureInternal(code: string, photoUrl: string): Promise<THREE.Texture | null> {
    // Extract file ID from the URL
    const fileId = extractDriveFileId(photoUrl);
    
    if (!fileId) {
      // Not a Google Drive URL - try loading directly
      console.log(`[LaminateTexture] Non-Drive URL for ${code}, loading directly`);
      try {
        const texture = await this._loadSingleTexture(photoUrl);
        if (texture) {
          this.textures.set(code, texture);
          return texture;
        }
      } catch (e) {
        console.warn(`[LaminateTexture] Direct load failed for ${code}`);
      }
      return null;
    }
    
    // Build base URLs for the Google Drive image
    const baseUrls = [
      getDriveThumbnailUrl(fileId, 1024),   // Large thumbnail
      getDriveThumbnailUrl(fileId, 800),    // Medium thumbnail
      getDriveDirectUrl(fileId),            // Direct download
    ];
    
    console.log(`[LaminateTexture] Loading texture for ${code} (fileId: ${fileId})`);
    
    // Try each CORS proxy with each base URL
    for (const proxyFn of CORS_PROXIES) {
      for (const baseUrl of baseUrls) {
        const proxiedUrl = proxyFn(baseUrl);
        try {
          const texture = await this._loadSingleTexture(proxiedUrl);
          if (texture) {
            this.textures.set(code, texture);
            console.log(`[LaminateTexture] ✓ Loaded ${code} via proxy`);
            return texture;
          }
        } catch (error) {
          // Try next combination
          continue;
        }
      }
    }
    
    // Last resort: Try loading via Image element with canvas conversion
    console.log(`[LaminateTexture] Trying canvas-based loading for ${code}`);
    try {
      const texture = await this._loadViaCanvas(fileId, code);
      if (texture) {
        this.textures.set(code, texture);
        console.log(`[LaminateTexture] ✓ Loaded ${code} via canvas`);
        return texture;
      }
    } catch (e) {
      console.debug(`[LaminateTexture] Canvas loading failed for ${code}`);
    }

    console.warn(`[LaminateTexture] ✗ All methods failed for ${code}`);
    return null;
  }
  
  /**
   * Load texture via HTML Image element and Canvas
   * This method converts the image to a data URL to bypass CORS
   */
  private async _loadViaCanvas(fileId: string, code: string): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeoutId = setTimeout(() => {
        console.debug(`[LaminateTexture] Canvas load timeout for ${code}`);
        resolve(null);
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 512;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Create texture from canvas
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 4;
          texture.needsUpdate = true;
          
          resolve(texture);
        } catch (e) {
          resolve(null);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(null);
      };
      
      // Try loading from wsrv.nl proxy (most reliable for images)
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(getDriveThumbnailUrl(fileId, 1024))}&w=1024&output=jpg&q=90`;
      img.src = proxyUrl;
    });
  }

  /**
   * Load a single texture URL
   */
  private _loadSingleTexture(url: string): Promise<THREE.Texture | null> {
    return new Promise((resolve, reject) => {
      this.getLoader().load(
        url,
        (texture) => {
          // Configure texture for tiling/wrapping
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
          
          // Improve texture quality
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 4;
          
          // Mark as needing update
          texture.needsUpdate = true;
          
          resolve(texture);
        },
        undefined, // Progress callback (not used)
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Check if a texture is cached
   */
  hasTexture(code: string): boolean {
    return this.textures.has(code);
  }

  /**
   * Get a cached texture without loading
   */
  getCachedTexture(code: string): THREE.Texture | null {
    return this.textures.get(code) || null;
  }

  /**
   * Clear all cached textures
   */
  clearCache(): void {
    this.textures.forEach((texture) => {
      texture.dispose();
    });
    this.textures.clear();
    console.log('[LaminateTexture] Cache cleared');
  }

  /**
   * Remove a specific texture from cache
   */
  removeTexture(code: string): void {
    const texture = this.textures.get(code);
    if (texture) {
      texture.dispose();
      this.textures.delete(code);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { count: number; codes: string[] } {
    return {
      count: this.textures.size,
      codes: Array.from(this.textures.keys()),
    };
  }
}

// Export singleton instance
export const LaminateTextureCache = new LaminateTextureCacheClass();

// ============================================
// REACT HOOKS
// ============================================

/**
 * Hook to load a laminate texture
 * Returns the texture and loading state
 */
export function useLaminateTexture(
  code: string | null | undefined,
  photoUrl: string | null | undefined
): {
  texture: THREE.Texture | null;
  isLoading: boolean;
  error: Error | null;
} {
  // This hook should be used inside a React component
  // For now, we provide a synchronous way to check cache
  // The actual loading is handled by the PlankMesh component
  
  if (!code || !photoUrl) {
    return { texture: null, isLoading: false, error: null };
  }

  const cached = LaminateTextureCache.getCachedTexture(code);
  return {
    texture: cached,
    isLoading: !cached && !!photoUrl,
    error: null,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Preload textures for a list of laminates
 */
export async function preloadLaminateTextures(
  laminates: Array<{ code: string; photoUrl?: string }>
): Promise<void> {
  const loadPromises = laminates
    .filter(lam => lam.photoUrl)
    .map(lam => LaminateTextureCache.loadTexture(lam.code, lam.photoUrl!));
  
  await Promise.allSettled(loadPromises);
  console.log(`[LaminateTexture] Preloaded ${loadPromises.length} textures`);
}

/**
 * Apply a laminate texture to a Three.js material
 */
export function applyTextureToMaterial(
  material: THREE.Material,
  texture: THREE.Texture | null
): void {
  if (!material || !('map' in material)) return;
  
  const meshMaterial = material as THREE.MeshLambertMaterial | THREE.MeshStandardMaterial;
  
  if (texture) {
    meshMaterial.map = texture;
    meshMaterial.needsUpdate = true;
  } else {
    meshMaterial.map = null;
    meshMaterial.needsUpdate = true;
  }
}

export default LaminateTextureCache;
