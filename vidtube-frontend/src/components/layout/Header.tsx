import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Video,
  Menu,
  X,
  Upload,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { videoService } from "../../services/videoService";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notificationService } from "../../services/notificationService.ts";
import { NotificationDropdown } from "../notification/NotificationDropdown";
import toast from "react-hot-toast";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showSuggestions || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showSuggestions, showNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowUserMenu(false);
      setShowNotifications(false);
    }
  }, [isAuthenticated]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await videoService.getSearchSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const { data: unreadCount, refetch: refetchNotifications } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      refetchNotifications();
    }
  }, [isAuthenticated, refetchNotifications]);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      toast.success("Logged out successfully");
      navigate("/");
    },
    onError: (error) => {
      logout();
      toast.error("Logged out (session expired)");
      navigate("/");
    },
  });

  const handleLogout = () => {
    if (logoutMutation.isPending) return;

    setShowUserMenu(false);
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
      setShowMobileSearch(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowMobileSearch(false);
  };

  const handleMobileSearchClick = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setTimeout(() => {
        const input = document.getElementById('mobile-search-input');
        if (input) (input as HTMLInputElement).focus();
      }, 0);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1 sm:gap-2 group cursor-pointer flex-shrink-0"
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-blue flex items-center justify-center shadow-glow"
            >
              <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-bold text-gradient hidden sm:block">
              VidTube
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div
            ref={searchRef}
            className="flex-1 max-w-2xl mx-2 sm:mx-4 lg:mx-8 hidden md:block relative"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search videos..."
                  className="glass-input w-full pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-tertiary hover:text-primary-500 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background-secondary backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search */}
            <button 
              onClick={handleMobileSearchClick}
              className="md:hidden text-text-primary hover:text-primary-500 transition-colors cursor-pointer flex-shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Upload Button */}
                <Link
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 btn-glass cursor-pointer flex-shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden lg:inline">Upload</span>
                </Link>

                {/* Notifications */}
                <div className="relative flex-shrink-0" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-text-primary hover:text-primary-500 transition-colors cursor-pointer"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 z-50">
                      <NotificationDropdown
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                      />
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative flex-shrink-0" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <img
                      src={user?.avatarUrl || "/default-avatar.jpg"}
                      alt={user?.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500/20 hover:ring-primary-500/50 transition-all"
                    />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-background-secondary backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 p-2"
                      >
                        <div className="px-3 py-2 border-b border-white/10 mb-2">
                          <p className="text-text-primary font-semibold">
                            {user?.fullName}
                          </p>
                          <p className="text-text-tertiary text-sm">
                            @{user?.username}
                          </p>
                        </div>

                        <Link
                          to={`/channel/${user?.username}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <User className="w-5 h-5" />
                          Your Channel
                        </Link>

                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          Dashboard
                        </Link>

                        <Link
                          to="/playlists"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <Video className="w-5 h-5" />
                          My Playlists
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <Settings className="w-5 h-5" />
                          Settings
                        </Link>

                        <div className="border-t border-white/10 my-2" />

                        <button
                          onClick={handleLogout}
                          disabled={logoutMutation.isPending}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LogOut className="w-5 h-5" />
                          {logoutMutation.isPending
                            ? "Logging out..."
                            : "Logout"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Link to="/login" className="btn-ghost hidden sm:block text-sm sm:text-base">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-text-primary flex-shrink-0"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 px-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search videos..."
                  className="glass-input w-full pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-tertiary hover:text-primary-500 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 bg-background-secondary backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 rounded-lg hover:bg-surface text-text-primary"
              >
                Home
              </Link>
              <Link
                to="/trending"
                className="block px-4 py-2 rounded-lg hover:bg-surface text-text-primary"
              >
                Trending
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 rounded-lg hover:bg-surface text-text-primary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 rounded-lg bg-primary-500 text-white text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
