import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  Users,
  LogOut,
  Settings,
  LayoutDashboard,
  Video,
  Clock3,
  History,
  ThumbsUp,
  Menu,
  X,
  Upload,
  Home,
  Play,
  Flame,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { videoService } from "../../services/videoService";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notificationService } from "../../services/notificationService.ts";
import { userPreferenceService } from "../../services/userPreferenceService.ts";
import { NotificationDropdown } from "../notification/NotificationDropdown";
import { useNotificationSocketConnection } from "../../hooks/useNotificationSocketConnection";
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
  const isRealtimeConnected = useNotificationSocketConnection();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const shouldLockBody = showMobileMenu || showNotifications;
    if (!shouldLockBody) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileMenu, showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      const clickedDesktopSearch = searchRef.current?.contains(
        event.target as Node,
      );
      const clickedMobileSearch = mobileSearchRef.current?.contains(
        event.target as Node,
      );
      if (!clickedDesktopSearch && !clickedMobileSearch) {
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

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: isRealtimeConnected ? false : 30_000,
    refetchIntervalInBackground: false,
  });

  const unreadNotificationCount =
    typeof unreadCount === "number" && Number.isFinite(unreadCount)
      ? Math.max(0, Math.floor(unreadCount))
      : 0;

  const { data: userPreferences } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: userPreferenceService.getPreferences,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  const prefersRightSidebarMenu = userPreferences?.ui?.rightSidebarMenu ?? true;
  const drawerOffscreenX = prefersRightSidebarMenu ? 340 : -340;
  const drawerPositionClass = prefersRightSidebarMenu
    ? "right-0 border-l"
    : "left-0 border-r";

  useEffect(() => {
    if (showMobileMenu) {
      document.body.setAttribute("data-drawer-open", "true");
      document.body.setAttribute(
        "data-drawer-side",
        prefersRightSidebarMenu ? "right" : "left",
      );
    } else {
      document.body.removeAttribute("data-drawer-open");
      document.body.removeAttribute("data-drawer-side");
    }

    return () => {
      document.body.removeAttribute("data-drawer-open");
      document.body.removeAttribute("data-drawer-side");
    };
  }, [showMobileMenu, prefersRightSidebarMenu]);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      toast.success("Logged out successfully");
      navigate("/");
    },
    onError: () => {
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
    setShowMobileMenu(false);
    setShowUserMenu(false);
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setTimeout(() => {
        const input = document.getElementById("mobile-search-input");
        if (input) (input as HTMLInputElement).focus();
      }, 0);
    }
  };

  const toggleNavigationDrawer = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMobileSearch(false);
    setShowMobileMenu((current) => !current);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-background-secondary/92 backdrop-blur-md shadow-[0_10px_26px_rgba(4,8,14,0.48)]">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-500/90 text-white flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.38)] ring-1 ring-white/18 group-hover:-translate-y-px transition-transform">
              <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-semibold text-text-primary hidden sm:block tracking-tight">
              VidTube
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-5">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-text-primary bg-surface-active"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/trending"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-text-primary bg-surface-active"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`
              }
            >
              Trending
            </NavLink>
            <NavLink
              to="/shorts"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-text-primary bg-surface-active"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`
              }
            >
              Shorts
            </NavLink>
          </nav>

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
                      <Search className="w-4 h-4 text-text-tertiary shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Mobile Search */}
            <button
              onClick={handleMobileSearchClick}
              className="md:hidden p-2 rounded-lg text-text-primary hover:text-primary-300 hover:bg-surface transition-colors shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="sm:hidden p-2 rounded-lg text-text-primary hover:text-primary-300 hover:bg-surface transition-colors shrink-0"
                  aria-label="Upload video"
                >
                  <Upload className="w-5 h-5" />
                </Link>

                {/* Upload Button */}
                <Link
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 btn-glass shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden lg:inline">Upload</span>
                </Link>

                {/* Notifications */}
                <div className="relative shrink-0" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg text-text-primary hover:text-primary-300 hover:bg-surface transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[9px] font-bold leading-none flex items-center justify-center text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:-top-1 sm:-right-1 sm:min-w-5 sm:h-5 sm:text-[10px]">
                        {unreadNotificationCount > 9
                          ? "9+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>

                {/* User Menu */}
                <div
                  className="relative shrink-0 hidden md:block"
                  ref={userMenuRef}
                >
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full p-0.5 hover:bg-surface transition-colors"
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
                        className="absolute right-0 mt-2 w-56 bg-background-secondary/96 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 p-2"
                      >
                        <div className="px-3 py-2 border-b border-white/8 mb-2">
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
                          to="/history"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <History className="w-5 h-5" />
                          Watch History
                        </Link>

                        <Link
                          to="/watch-later"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <Clock3 className="w-5 h-5" />
                          Watch Later
                        </Link>

                        <Link
                          to="/liked-videos"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          Liked Videos
                        </Link>

                        <Link
                          to="/subscriptions"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text-primary"
                        >
                          <Users className="w-5 h-5" />
                          Subscriptions
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
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className="btn-ghost hidden sm:block text-sm sm:text-base"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Navigation Drawer Toggle */}
            <button
              onClick={toggleNavigationDrawer}
              className="p-2 rounded-lg text-text-primary hover:text-primary-300 hover:bg-surface shrink-0"
              aria-label={
                showMobileMenu
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
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
          <div ref={mobileSearchRef} className="md:hidden pb-3 px-2">
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
                    <Search className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 z-40 bg-black/45"
              aria-label="Close mobile menu"
            />
            <motion.div
              initial={{ x: drawerOffscreenX, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: drawerOffscreenX, opacity: 0 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              style={{ willChange: "transform" }}
              className={`fixed top-0 bottom-0 z-50 w-[min(90vw,22rem)] ${drawerPositionClass} border-white/12 bg-background-secondary shadow-[0_16px_44px_rgba(0,0,0,0.5)]`}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <p className="text-sm font-semibold tracking-[0.18em] text-text-tertiary uppercase">
                  Navigation
                </p>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-4 space-y-2 max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
                {isAuthenticated && (
                  <div className="rounded-xl border border-white/10 bg-surface p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatarUrl || "/default-avatar.jpg"}
                        alt={user?.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/20"
                      />
                      <div>
                        <p className="text-text-primary font-semibold leading-tight">
                          {user?.fullName}
                        </p>
                        <p className="text-text-tertiary text-sm leading-tight">
                          @{user?.username}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  to="/"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                >
                  <Home className="w-4 h-4 text-text-tertiary" />
                  Home
                </Link>
                <Link
                  to="/trending"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                >
                  <Flame className="w-4 h-4 text-text-tertiary" />
                  Trending
                </Link>
                <Link
                  to="/shorts"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                >
                  <Play className="w-4 h-4 text-text-tertiary" />
                  Shorts
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/upload"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <Upload className="w-4 h-4 text-text-tertiary" />
                      Upload
                    </Link>
                    <Link
                      to={`/channel/${user?.username}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <User className="w-4 h-4 text-text-tertiary" />
                      Your Channel
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <LayoutDashboard className="w-4 h-4 text-text-tertiary" />
                      Dashboard
                    </Link>
                    <Link
                      to="/playlists"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <Video className="w-4 h-4 text-text-tertiary" />
                      My Playlists
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <History className="w-4 h-4 text-text-tertiary" />
                      Watch History
                    </Link>
                    <Link
                      to="/watch-later"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <Clock3 className="w-4 h-4 text-text-tertiary" />
                      Watch Later
                    </Link>
                    <Link
                      to="/liked-videos"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <ThumbsUp className="w-4 h-4 text-text-tertiary" />
                      Liked Videos
                    </Link>
                    <Link
                      to="/subscriptions"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <Users className="w-4 h-4 text-text-tertiary" />
                      Subscriptions
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      <Settings className="w-4 h-4 text-text-tertiary" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleLogout();
                      }}
                      disabled={logoutMutation.isPending}
                      className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-surface text-red-400 disabled:opacity-50"
                    >
                      {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </button>
                  </>
                )}

                {!isAuthenticated && (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-4 py-2.5 rounded-lg hover:bg-surface text-text-primary"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-4 py-2.5 rounded-lg bg-primary-500 text-white text-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
