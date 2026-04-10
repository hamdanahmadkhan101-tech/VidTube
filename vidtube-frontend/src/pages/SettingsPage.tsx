import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, Camera, Save, Loader2 } from "lucide-react";
import { authService } from "../services/authService.ts";
import { userPreferenceService } from "../services/userPreferenceService.ts";
import { useAuthStore } from "../store/authStore.ts";
import { handleApiError } from "../services/apiClient.ts";
import toast from "react-hot-toast";

const toSingleFileList = (file: File): FileList => {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  return dataTransfer.files;
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rightSidebarMenuOverride, setRightSidebarMenuOverride] = useState<
    boolean | null
  >(null);

  const { data: userPreferences, isLoading: isPreferencesLoading } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: userPreferenceService.getPreferences,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const savedRightSidebarMenu = userPreferences?.ui?.rightSidebarMenu ?? true;
  const rightSidebarMenu = rightSidebarMenuOverride ?? savedRightSidebarMenu;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (fullName !== user?.fullName) formData.append("fullName", fullName);
      if (bio !== user?.bio) formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("coverImage", coverFile);

      return authService.updateProfile({
        fullName,
        bio,
        avatar: avatarFile ? toSingleFileList(avatarFile) : undefined,
        coverImage: coverFile ? toSingleFileList(coverFile) : undefined,
      });
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["user", user?.username] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authService.changePassword(oldPassword, newPassword),
    onSuccess: async () => {
      toast.success("Password changed successfully! Please login again.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Logout user and redirect to login
      await authService.logout();
      setUser(null);
      navigate("/login");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () =>
      userPreferenceService.updatePreferences({
        ui: {
          rightSidebarMenu,
        },
      }),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(["userPreferences"], updatedPreferences);
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      setRightSidebarMenuOverride(null);
      toast.success("Interface preferences updated");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const hasRightSidebarPreferenceChanged =
    rightSidebarMenu !== savedRightSidebarMenu;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Avatar must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Cover image must be less than 10MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="page-wrap page-stack max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-stack"
      >
        <div className="page-hero">
          <span className="kicker-pill">Channel Controls</span>
          <h1 className="page-title mt-3 mb-1">Settings</h1>
          <p className="page-subtitle">
            Update your profile branding and secure your account.
          </p>
        </div>

        {/* Profile Settings */}
        <div className="section-card p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Profile Settings
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500/20">
                  <img
                    src={
                      avatarPreview ||
                      user?.avatarUrl ||
                      user?.avatar ||
                      "/default-avatar.jpg"
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/55 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-sm text-text-secondary">
                  <p>Click to upload new avatar</p>
                  <p className="text-xs text-text-muted">PNG, JPG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Cover Image
              </label>
              <div className="relative h-48 rounded-xl overflow-hidden border-2 border-white/10 section-card-soft">
                <img
                  src={
                    coverPreview ||
                    user?.coverUrl ||
                    user?.coverImage ||
                    "/default-cover.jpg"
                  }
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 bg-black/55 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm">
                      Click to upload cover image
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input w-full"
                placeholder="Your full name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="glass-input w-full h-32 resize-none"
                placeholder="Tell viewers about your channel"
                maxLength={500}
              />
              <p className="text-xs text-text-muted mt-1">{bio.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Interface Preferences */}
        <div className="section-card p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Interface Preferences
          </h2>

          <div className="section-card-soft p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-text-primary font-semibold">
                  Right-side mobile menu
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Control whether the hamburger drawer opens from the right or
                  left side.
                </p>
              </div>

              <button
                type="button"
                disabled={isPreferencesLoading}
                onClick={() => setRightSidebarMenuOverride(!rightSidebarMenu)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                  rightSidebarMenu
                    ? "bg-primary-500 border-primary-300/70"
                    : "bg-surface border-white/20"
                } ${isPreferencesLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                aria-label="Toggle mobile menu side"
                aria-pressed={rightSidebarMenu}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    rightSidebarMenu ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => updatePreferencesMutation.mutate()}
                disabled={
                  updatePreferencesMutation.isPending ||
                  !hasRightSidebarPreferenceChanged
                }
                className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatePreferencesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Interface
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="section-card p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="glass-input w-full"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input w-full"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
