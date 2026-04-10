import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import { Header } from "./components/layout/Header";
import { NotificationRealtimeBridge } from "./components/notification/NotificationRealtimeBridge";
import { useAuthStore } from "./store/authStore";

// Lazy load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ChannelPage = lazy(() => import("./pages/ChannelPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));
const TrendingPage = lazy(() => import("./pages/TrendingPage"));
const ShortsPage = lazy(() => import("./pages/ShortsPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const PlaylistsPage = lazy(() => import("./pages/PlaylistsPage"));
const EditVideoPage = lazy(() => import("./pages/EditVideoPage"));
const WatchHistoryPage = lazy(() => import("./pages/WatchHistoryPage"));
const LikedVideosPage = lazy(() => import("./pages/LikedVideosPage"));
const WatchLaterPage = lazy(() => import("./pages/WatchLaterPage"));
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null;

const useMotionSettings = () => {
  const [settings, setSettings] = useState({
    isCompact: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 640px)");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setSettings({
        isCompact: compactQuery.matches,
        prefersReducedMotion: reducedQuery.matches,
      });
    };

    update();

    if (compactQuery.addEventListener) {
      compactQuery.addEventListener("change", update);
      reducedQuery.addEventListener("change", update);
    } else {
      compactQuery.addListener(update);
      reducedQuery.addListener(update);
    }

    return () => {
      if (compactQuery.removeEventListener) {
        compactQuery.removeEventListener("change", update);
        reducedQuery.removeEventListener("change", update);
      } else {
        compactQuery.removeListener(update);
        reducedQuery.removeListener(update);
      }
    };
  }, []);

  return settings;
};

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
  const { isCompact, prefersReducedMotion } = useMotionSettings();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MotionConfig
          reducedMotion={prefersReducedMotion ? "always" : "user"}
          transition={{ duration: isCompact ? 0.16 : 0.24, ease: "easeOut" }}
        >
          <div className="min-h-screen app-shell bg-background">
            <Header />
            <NotificationRealtimeBridge />

            <main>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/watch/:videoId" element={<VideoPlayerPage />} />
                  <Route path="/channel/:username" element={<ChannelPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/trending" element={<TrendingPage />} />
                  <Route path="/shorts" element={<ShortsPage />} />
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
                  <Route
                    path="/verify-email"
                    element={
                      <GuestRoute>
                        <VerifyEmailPage />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPasswordPage />
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
                    path="/edit/:videoId"
                    element={
                      <ProtectedRoute>
                        <EditVideoPage />
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
                    path="/playlists"
                    element={
                      <ProtectedRoute>
                        <PlaylistsPage />
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
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <WatchHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/liked-videos"
                    element={
                      <ProtectedRoute>
                        <LikedVideosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/watch-later"
                    element={
                      <ProtectedRoute>
                        <WatchLaterPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Not Found */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen flex items-center justify-center px-4">
                        <div className="page-hero text-center max-w-xl w-full">
                          <h1 className="text-6xl font-bold text-gradient mb-4">
                            404
                          </h1>
                          <p className="text-text-secondary text-xl mb-6">
                            Page not found
                          </p>
                          <Link to="/" className="btn-primary">
                            Go Home
                          </Link>
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
                duration: 2200,
                style: {
                  background: "rgba(19, 25, 34, 0.94)",
                  color: "#f2f4f7",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(190, 206, 226, 0.22)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  boxShadow: "0 16px 32px rgba(2, 6, 12, 0.45)",
                },
                success: {
                  iconTheme: {
                    primary: "#c26e2e",
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
            {Devtools ? (
              <Suspense fallback={null}>
                <Devtools initialIsOpen={false} />
              </Suspense>
            ) : null}
          </div>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
