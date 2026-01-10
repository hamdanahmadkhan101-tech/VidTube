import { Link, useNavigate } from "react-router-dom";
import { Search, Upload, User, BarChart3, ListMusic } from "lucide-react";
import { useState } from "react";
import useAuth from "../../hooks/useAuth.js";
import NotificationBell from "../social/NotificationBell.jsx";
import Button from "../ui/Button.jsx";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      // Logout errors are handled in AuthContext
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md supports-backdrop-filter:bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 shrink-0"
            aria-label="VidTube Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <svg
                className="h-5 w-5 fill-white text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              VidTube
            </h1>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-4 hidden md:block"
            role="search"
            aria-label="Site search"
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-textSecondary"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-surface-light text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Search videos"
              />
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/search" className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Upload</span>
                  </Button>
                </Link>
                <Link to="/playlists" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ListMusic className="h-4 w-4" />
                    <span className="hidden lg:inline">Playlists</span>
                  </Button>
                </Link>
                <Link to="/dashboard" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Button>
                </Link>
                <NotificationBell />
                <Link
                  to={`/channel/${user?.username || user?._id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {(user?.fullName || user?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="hidden text-sm font-medium text-textSecondary sm:inline-block">
                    {user?.fullName || user?.username}
                  </span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/search" className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
