import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { VideoGridSkeleton, VideoDetailSkeleton } from "./components/common/LoadingSkeleton.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AuthLayout from "./components/auth/AuthLayout.jsx";
import useAuth from "./hooks/useAuth.js";

// Lazy load pages for code splitting and better performance
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const UploadPage = lazy(() => import("./pages/video/UploadPage.jsx"));
const VideoDetailPage = lazy(() => import("./pages/video/VideoDetailPage.jsx"));
const VideoEditPage = lazy(() => import("./pages/video/VideoEditPage.jsx"));
const SearchPage = lazy(() => import("./pages/video/SearchPage.jsx"));
const ChannelPage = lazy(() => import("./pages/channel/ChannelPage.jsx"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage.jsx"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage.jsx"));

import PageLoader from "./components/common/PageLoader.jsx";
import SkipToContent from "./components/common/SkipToContent.jsx";

function ProfileRedirect() {
  const { user } = useAuth();
  if (user?.username) {
    return <Navigate to={`/channel/${user.username}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SkipToContent />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#272727",
              color: "#ffffff",
              border: "1px solid #404040",
            },
            duration: 3000,
          }}
        />
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <HomePage />
                </Suspense>
              }
            />

            <Route
              element={
                <Suspense fallback={<PageLoader />}>
                  <AuthLayout />
                </Suspense>
              }
            >
              <Route
                path="/login"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                  </Suspense>
                }
              />
              <Route
                path="/register"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RegisterPage />
                  </Suspense>
                }
              />
            </Route>

            {/* Video Routes */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <UploadPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:videoId"
              element={
                <Suspense fallback={<VideoDetailSkeleton />}>
                  <VideoDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/video/:videoId/edit"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <VideoEditPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <Suspense fallback={<VideoGridSkeleton />}>
                  <SearchPage />
                </Suspense>
              }
            />

            {/* Channel Routes */}
            <Route
              path="/channel/:username"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ChannelPage />
                </Suspense>
              }
            />

            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Notifications Route */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <NotificationsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Profile Route - Redirect to channel */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFoundPage />
                </Suspense>
              }
            />
            </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
