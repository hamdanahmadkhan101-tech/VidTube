import React, { useState } from "react";
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
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // Close dropdowns when user logs out
  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowUserMenu(false);
      setShowNotifications(false);
    }
  }, [isAuthenticated]);

  // Fetch unread notification count
  const { data: unreadCount } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      toast.success("Logged out successfully");
      navigate("/");
    },
    onError: (error) => {
      // If logout fails (401), still clear local auth state
      logout();
      toast.error("Logged out (session expired)");
      navigate("/");
    },
  });

  const handleLogout = () => {
    // Prevent multiple clicks
    if (logoutMutation.isPending) return;

    setShowUserMenu(false);
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1 sm:gap-2 group cursor-pointer"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-blue flex items-center justify-center shadow-glow"
            >
              <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <span className="text-lg sm:text-2xl font-bold text-gradient hidden sm:block">
              VidTube
            </span>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-2 sm:mx-4 lg:mx-8 hidden md:block"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search */}
            <button className="md:hidden text-text-primary hover:text-primary-500 transition-colors cursor-pointer">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Upload Button */}
                <Link
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 btn-glass cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden lg:inline">Upload</span>
                </Link>

                {/* Notifications */}
                <div className="relative">
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

                  <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
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
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost hidden sm:block">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-text-primary"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
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
