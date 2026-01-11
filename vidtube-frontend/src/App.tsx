import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Header } from "./components/layout/Header";
import { useAuthStore } from "./store/authStore";

// Lazy load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ChannelPage = lazy(() => import("./pages/ChannelPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));
const TrendingPage = lazy(() => import("./pages/TrendingPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

// Create QueryClient with optimized config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Loading Fallback Component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
  </div>
);

// Protected Route Component (for future use)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Guest Route Component (redirect if authenticated)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Header />

          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/watch/:videoId" element={<VideoPlayerPage />} />
                <Route path="/channel/:username" element={<ChannelPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route
                  path="/playlist/:playlistId"
                  element={<PlaylistPage />}
                />

                {/* Auth Routes (Guest Only) */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <LoginPage />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <RegisterPage />
                    </GuestRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscriptions"
                  element={
                    <ProtectedRoute>
                      <SubscriptionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gradient mb-4">
                          404
                        </h1>
                        <p className="text-text-secondary text-xl mb-6">
                          Page not found
                        </p>
                        <a href="/" className="btn-primary">
                          Go Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2000,
              style: {
                background: "rgba(20, 20, 20, 0.9)",
                color: "#fff",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "16px",
              },
              success: {
                iconTheme: {
                  primary: "#8b5cf6",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </BrowserRouter>

      {/* React Query Devtools (only in development) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
