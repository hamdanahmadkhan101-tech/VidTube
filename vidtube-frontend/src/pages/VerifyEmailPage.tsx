import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, Loader2, RotateCcw, Video } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService.ts";
import { handleApiError } from "../services/apiClient.ts";
import toast from "react-hot-toast";
import type { VerifyEmailOtpFormData } from "../types/index.ts";

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<VerifyEmailOtpFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
    },
  });

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const verifyMutation = useMutation({
    mutationFn: authService.verifyEmailOtp,
    onSuccess: () => {
      toast.success("Email verified successfully. Please sign in.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const resendMutation = useMutation({
    mutationFn: authService.resendVerificationOtp,
    onSuccess: () => {
      toast.success("Verification OTP sent.");
      setResendCooldown(60);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const onSubmit = (data: VerifyEmailOtpFormData) => {
    verifyMutation.mutate(data);
  };

  const handleResendOtp = () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    resendMutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-liquid-lux">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-accent-blue flex items-center justify-center shadow-glow mx-auto mb-4"
          >
            <Video className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Verify Email
          </h1>
          <p className="text-text-secondary">
            Enter the 6-digit OTP sent to your email address
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-text-primary font-medium mb-2"
              >
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                placeholder="your@email.com"
                className="glass-input w-full"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="otp"
                className="block text-text-primary font-medium mb-2"
              >
                OTP Code
              </label>
              <div className="relative">
                <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
                <input
                  {...register("otp")}
                  type="text"
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  className="glass-input w-full pl-11"
                />
              </div>
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendMutation.isPending || resendCooldown > 0}
            className="btn-glass w-full mt-3 flex items-center justify-center gap-2"
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend OTP"}
              </>
            )}
          </button>

          <p className="text-center text-text-secondary mt-6">
            Already verified?{" "}
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

export default VerifyEmailPage;
