import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail, ShieldCheck, Video } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService.ts";
import { handleApiError } from "../services/apiClient.ts";
import toast from "react-hot-toast";
import type {
  RequestPasswordResetOtpFormData,
  ResetPasswordWithOtpFormData,
} from "../types/index.ts";

const requestOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [otpRequested, setOtpRequested] = React.useState(false);

  const requestForm = useForm<RequestPasswordResetOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordWithOtpFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: authService.requestPasswordResetOtp,
    onSuccess: (_, variables) => {
      toast.success("If the account exists, OTP has been sent.");
      setOtpRequested(true);
      resetForm.setValue("email", variables.email);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPasswordWithOtp,
    onSuccess: () => {
      toast.success("Password reset successful. Please sign in.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const onRequestOtp = (data: RequestPasswordResetOtpFormData) => {
    requestOtpMutation.mutate(data);
  };

  const onResetPassword = (data: ResetPasswordWithOtpFormData) => {
    resetPasswordMutation.mutate(data);
  };

  const resendOtp = () => {
    const email = resetForm.getValues("email");
    if (!email) {
      toast.error("Email is required");
      return;
    }
    requestOtpMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 auth-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="inline-flex rounded-full border border-primary-300/35 bg-primary-300/10 px-3 py-1 text-[11px] font-semibold tracking-widest uppercase text-primary-100 mb-4">
            Account Recovery
          </span>
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.25 }}
            className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 via-accent-blue to-accent-cyan flex items-center justify-center shadow-glow mx-auto mb-4 ring-1 ring-white/25"
          >
            <Video className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Reset Password
          </h1>
          <p className="text-text-secondary text-sm sm:text-base">
            {otpRequested
              ? "Enter OTP and your new password"
              : "Request an OTP to reset your password"}
          </p>
        </div>

        <div className="glass-card p-8">
          {!otpRequested ? (
            <form
              onSubmit={requestForm.handleSubmit(onRequestOtp)}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="request-email"
                  className="block text-text-primary font-semibold mb-2 text-sm"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                  <input
                    {...requestForm.register("email")}
                    type="email"
                    id="request-email"
                    placeholder="your@email.com"
                    className="glass-input w-full pl-11"
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {requestForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={requestOtpMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {requestOtpMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          ) : (
            <form
              onSubmit={resetForm.handleSubmit(onResetPassword)}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-text-primary font-semibold mb-2 text-sm"
                >
                  Email
                </label>
                <input
                  {...resetForm.register("email")}
                  type="email"
                  id="reset-email"
                  className="glass-input w-full"
                />
                {resetForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-otp"
                  className="block text-text-primary font-semibold mb-2 text-sm"
                >
                  OTP Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                  <input
                    {...resetForm.register("otp")}
                    type="text"
                    id="reset-otp"
                    maxLength={6}
                    placeholder="123456"
                    className="glass-input w-full pl-11"
                  />
                </div>
                {resetForm.formState.errors.otp && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-text-primary font-semibold mb-2 text-sm"
                >
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                  <input
                    {...resetForm.register("newPassword")}
                    type="password"
                    id="new-password"
                    placeholder="••••••••"
                    className="glass-input w-full pl-11"
                  />
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={requestOtpMutation.isPending}
                className="btn-glass w-full"
              >
                Resend OTP
              </button>
            </form>
          )}

          <p className="text-center text-text-secondary mt-6">
            Back to{" "}
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

export default ForgotPasswordPage;
