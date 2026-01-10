import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Route-level Error Boundary
 * Wraps individual routes to catch errors without breaking the entire app
 */
export default function ErrorBoundaryRoute({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
