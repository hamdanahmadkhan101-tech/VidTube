import apiClient from "./apiClient";
import type {
  ApiResponse,
  UpdateUserPreferencesPayload,
  UserPreferences,
} from "../types";

type UserPreferencesEnvelope = {
  preferences: UserPreferences;
};

export const userPreferenceService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const response =
      await apiClient.get<ApiResponse<UserPreferencesEnvelope>>(
        "/users/preferences",
      );
    return response.data.data!.preferences;
  },

  updatePreferences: async (
    payload: UpdateUserPreferencesPayload,
  ): Promise<UserPreferences> => {
    const response = await apiClient.patch<
      ApiResponse<UserPreferencesEnvelope>
    >("/users/preferences", payload);
    return response.data.data!.preferences;
  },
};
