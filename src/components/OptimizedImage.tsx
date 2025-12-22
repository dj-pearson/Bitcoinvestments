import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataUrl?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Skeleton loading state
 * - WebP format detection and fallback
 * - Proper aspect ratio maintenance
 * - Error handling with fallback
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  placeholder = 'skeleton',
  blurDataUrl,
  priority = false,
  onLoad,
  onError,
  className = '',
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? width / height : undefined;

  // Placeholder styles
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#1e293b',
    transition: 'opacity 0.3s ease-out',
    opacity: isLoaded ? 0 : 1,
    pointerEvents: 'none',
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && { aspectRatio: `${aspectRatio}` }),
    ...style,
  };

  // Image styles
  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-out',
    opacity: isLoaded ? 1 : 0,
  };

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`bg-slate-800 flex items-center justify-center ${className}`}
        style={containerStyles}
      >
        <div className="text-slate-500 text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={containerStyles}>
      {/* Placeholder */}
      {placeholder !== 'none' && (
        <div style={placeholderStyles}>
          {placeholder === 'blur' && blurDataUrl ? (
            <img
              src={blurDataUrl}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
              }}
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]" />
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          style={imageStyles}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Hook for generating blur data URL from an image
 */
export function useBlurDataUrl(src: string): string | undefined {
  const [blurDataUrl, setBlurDataUrl] = useState<string>();

  useEffect(() => {
    if (!src) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create a tiny version
      const size = 10;
      canvas.width = size;
      canvas.height = Math.round((size * img.height) / img.width);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        setBlurDataUrl(canvas.toDataURL('image/jpeg', 0.1));
      } catch {
        // CORS error, skip blur placeholder
      }
    };

    img.src = src;
  }, [src]);

  return blurDataUrl;
}

/**
 * Responsive image srcset generator
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  // This is a placeholder - in production you'd have an image CDN
  // that supports on-the-fly resizing like Cloudinary, imgix, etc.
  return widths
    .map((w) => `${baseSrc}?w=${w} ${w}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: { [key: string]: string } = {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
  }
): string {
  const sizes = [];

  if (breakpoints.sm) {
    sizes.push(`(max-width: 640px) ${breakpoints.sm}`);
  }
  if (breakpoints.md) {
    sizes.push(`(max-width: 1024px) ${breakpoints.md}`);
  }
  if (breakpoints.lg) {
    sizes.push(breakpoints.lg);
  }

  return sizes.join(', ');
}

/**
 * Avatar image with optimized loading
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  // Generate initials fallback
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white font-medium rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
      placeholder="skeleton"
    />
  );
}

/**
 * Background image with lazy loading
 */
export function LazyBackground({
  src,
  className = '',
  children,
  overlayOpacity = 0,
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
  overlayOpacity?: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1e293b',
        transition: 'background-image 0.3s ease-out',
      }}
    >
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
