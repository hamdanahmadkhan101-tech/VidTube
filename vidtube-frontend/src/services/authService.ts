import apiClient from "./apiClient";
import type {
  ApiResponse,
  AuthUser,
  LoginFormData,
  RequestPasswordResetOtpFormData,
  ResetPasswordWithOtpFormData,
  RegisterFormData,
  UpdateProfileFormData,
  VerifyEmailOtpFormData,
  User,
} from "../types";

export const authService = {
  // Register new user
  register: async (data: RegisterFormData): Promise<AuthUser> => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("username", data.username);
    formData.append("email", data.email);
    formData.append("password", data.password);

    if (data.avatar && data.avatar.length > 0) {
      formData.append("avatar", data.avatar[0]);
    }

    if (data.coverImage && data.coverImage.length > 0) {
      formData.append("coverImage", data.coverImage[0]);
    }

    const response = await apiClient.post<ApiResponse<AuthUser>>(
      "/users/register",
      formData,
    );
    return response.data.data!;
  },

  // Login user
  login: async (data: LoginFormData): Promise<AuthUser> => {
    const response = await apiClient.post<
      ApiResponse<{ user: AuthUser; accessToken: string }>
    >("/users/login", data);
    return {
      ...response.data.data!.user,
      accessToken: response.data.data!.accessToken,
    };
  },

  // Get current user
  getCurrentUser: async (): Promise<AuthUser> => {
    const response =
      await apiClient.get<ApiResponse<AuthUser>>("/users/profile");
    return response.data.data!;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await apiClient.post("/users/logout");
  },

  // Refresh token
  refreshToken: async (): Promise<void> => {
    await apiClient.post("/users/refresh-token");
  },

  // Verify email using OTP
  verifyEmailOtp: async (data: VerifyEmailOtpFormData): Promise<void> => {
    await apiClient.post<ApiResponse>("/users/verify-email-otp", data);
  },

  // Resend verification OTP
  resendVerificationOtp: async (email: string): Promise<void> => {
    await apiClient.post<ApiResponse>("/users/resend-verification-otp", {
      email,
    });
  },

  // Request password reset OTP
  requestPasswordResetOtp: async (
    data: RequestPasswordResetOtpFormData,
  ): Promise<void> => {
    await apiClient.post<ApiResponse>("/users/forgot-password-otp", data);
  },

  // Reset password using OTP
  resetPasswordWithOtp: async (
    data: ResetPasswordWithOtpFormData,
  ): Promise<void> => {
    await apiClient.post<ApiResponse>("/users/reset-password-otp", data);
  },

  // Update profile
  updateProfile: async (data: UpdateProfileFormData): Promise<User> => {
    // Update basic profile info
    const profileData: Partial<
      Pick<UpdateProfileFormData, "fullName" | "bio">
    > = {};
    if (data.fullName !== undefined) profileData.fullName = data.fullName;
    if (data.bio !== undefined) profileData.bio = data.bio;

    let updatedUser: User | null = null;

    // Update text fields if any
    if (Object.keys(profileData).length > 0) {
      const response = await apiClient.patch<ApiResponse<User>>(
        "/users/update-profile",
        profileData,
      );
      updatedUser = response.data.data!;
    }

    // Update avatar separately if provided
    if (data.avatar && data.avatar.length > 0) {
      const avatarFormData = new FormData();
      avatarFormData.append("avatar", data.avatar[0]);
      const avatarResponse = await apiClient.patch<ApiResponse<User>>(
        "/users/avatar",
        avatarFormData,
      );
      updatedUser = avatarResponse.data.data!;
    }

    // Update cover image separately if provided
    if (data.coverImage && data.coverImage.length > 0) {
      const coverFormData = new FormData();
      coverFormData.append("coverImage", data.coverImage[0]);
      const coverResponse = await apiClient.patch<ApiResponse<User>>(
        "/users/cover-image",
        coverFormData,
      );
      updatedUser = coverResponse.data.data!;
    }

    if (!updatedUser) {
      throw new Error("No updates provided");
    }

    return updatedUser;
  },

  // Change password
  changePassword: async (
    oldPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await apiClient.patch("/users/change-password", {
      currentPassword: oldPassword,
      newPassword,
    });
  },

  // Get user profile by username
  getUserProfile: async (username: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(
      `/users/c/${username}`,
    );
    // Backend returns the channel directly in data field
    if (!response.data.data) {
      throw new Error("User not found");
    }
    return response.data.data;
  },
};
