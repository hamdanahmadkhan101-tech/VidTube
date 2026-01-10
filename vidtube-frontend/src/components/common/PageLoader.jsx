/**
 * Page Loader Component
 * Consistent loading state for lazy-loaded pages
 */
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div 
          className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-textSecondary">Loading...</p>
        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
}
