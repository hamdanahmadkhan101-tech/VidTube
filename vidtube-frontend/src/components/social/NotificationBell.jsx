import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { getUnreadCount } from "../../services/notificationService.js";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Polling for notifications (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.data.data.count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <Link
        to="/notifications"
        className="relative p-2 hover:bg-surface rounded-full transition-colors"
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        <Bell className="h-5 w-5 text-textSecondary" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      {/* Dropdown Preview (optional) */}
      {showDropdown && unreadCount > 0 && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-white">
              {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
            </h3>
          </div>
          <div className="p-4 text-center text-sm text-textSecondary">
            <Link
              to="/notifications"
              className="mt-2 inline-block text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
