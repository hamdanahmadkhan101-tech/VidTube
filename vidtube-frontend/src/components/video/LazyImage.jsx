import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Lazy Loading Image Component
 * Loads images only when they enter the viewport
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder = null,
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-surface animate-pulse flex items-center justify-center">
          {placeholder || (
            <ImageIcon className="h-8 w-8 text-textSecondary opacity-50" />
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-surface flex items-center justify-center">
          <div className="text-center p-4">
            <ImageIcon className="h-8 w-8 text-textSecondary mx-auto mb-2 opacity-50" />
            <p className="text-xs text-textSecondary">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}
