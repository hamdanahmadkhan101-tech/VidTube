import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Video,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService.ts";
import { handleApiError } from "../services/apiClient.ts";
import toast from "react-hot-toast";
import type { RegisterFormData } from "../types/index.ts";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  avatar: z.any().optional(),
});

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const avatarFile = useWatch({ control, name: "avatar" });
  const passwordValue = useWatch({ control, name: "password" });
  const emailValue = useWatch({ control, name: "email" });

  // Password validation checks
  const passwordChecks = {
    minLength: passwordValue?.length >= 8,
    hasUpperCase: /[A-Z]/.test(passwordValue || ""),
    hasLowerCase: /[a-z]/.test(passwordValue || ""),
    hasNumber: /[0-9]/.test(passwordValue || ""),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue || ""),
  };

  // Email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue || "");

  React.useEffect(() => {
    if (avatarFile && avatarFile.length > 0) {
      const file = avatarFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [avatarFile]);

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-liquid-lux">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-500 to-accent-blue flex items-center justify-center shadow-glow mx-auto mb-3"
          >
            <Video className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gradient mb-1">
            Join VidTube
          </h1>
          <p className="text-text-secondary text-sm">
            Create your account and start sharing
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary-500/20 group-hover:ring-primary-500/50 transition-all">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <User className="w-10 h-10 text-text-tertiary" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer shadow-glow hover:bg-primary-600 transition-colors"
                >
                  <Upload className="w-4 h-4 text-white" />
                </label>
                <input
                  {...register("avatar")}
                  type="file"
                  id="avatar"
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-text-tertiary text-xs">
                Upload profile picture (optional)
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-text-primary font-medium mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                <input
                  {...register("fullName")}
                  type="text"
                  id="fullName"
                  placeholder="John Doe"
                  className="glass-input w-full pl-11 relative z-0"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-text-primary font-medium mb-2"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none z-10 font-medium">
                  @
                </span>
                <input
                  {...register("username")}
                  type="text"
                  id="username"
                  placeholder="johndoe"
                  className="glass-input w-full pl-9 relative z-0"
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-text-primary font-medium mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  className="glass-input w-full pl-11 relative z-0"
                />
                {emailValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    {isValidEmail ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-text-primary font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="glass-input w-full pl-11 pr-11 relative z-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors z-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              {passwordValue && (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-text-secondary text-[10px] font-medium">
                    Password requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-0.5">
                    <div
                      className={`flex items-center gap-0.5 text-[10px] ${
                        passwordChecks.minLength
                          ? "text-green-500"
                          : "text-text-tertiary"
                      }`}
                    >
                      {passwordChecks.minLength ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <X className="w-2.5 h-2.5" />
                      )}
                      <span>8+ chars</span>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 text-[10px] ${
                        passwordChecks.hasUpperCase
                          ? "text-green-500"
                          : "text-text-tertiary"
                      }`}
                    >
                      {passwordChecks.hasUpperCase ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <X className="w-2.5 h-2.5" />
                      )}
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 text-[10px] ${
                        passwordChecks.hasLowerCase
                          ? "text-green-500"
                          : "text-text-tertiary"
                      }`}
                    >
                      {passwordChecks.hasLowerCase ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <X className="w-2.5 h-2.5" />
                      )}
                      <span>Lowercase</span>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 text-[10px] ${
                        passwordChecks.hasNumber
                          ? "text-green-500"
                          : "text-text-tertiary"
                      }`}
                    >
                      {passwordChecks.hasNumber ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <X className="w-2.5 h-2.5" />
                      )}
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-text-tertiary text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Sign In Link */}
          <p className="text-center text-text-secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
