import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import UploadPage from "./pages/video/UploadPage.jsx";
import VideoDetailPage from "./pages/video/VideoDetailPage.jsx";
import VideoEditPage from "./pages/video/VideoEditPage.jsx";
import SearchPage from "./pages/video/SearchPage.jsx";
import ChannelPage from "./pages/channel/ChannelPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AuthLayout from "./components/auth/AuthLayout.jsx";
import useAuth from "./hooks/useAuth.js";

function ProfileRedirect() {
  const { user } = useAuth();
  if (user?.username) {
    return <Navigate to={`/channel/${user.username}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#272727",
              color: "#ffffff",
              border: "1px solid #404040",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Video Routes */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route path="/video/:videoId" element={<VideoDetailPage />} />
          <Route
            path="/video/:videoId/edit"
            element={
              <ProtectedRoute>
                <VideoEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<SearchPage />} />

          {/* Channel Routes */}
          <Route path="/channel/:username" element={<ChannelPage />} />

          {/* Profile Route - Redirect to channel */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileRedirect />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
