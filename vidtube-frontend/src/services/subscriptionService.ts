import apiClient from "./apiClient";
import type { ApiResponse, Subscription, User } from "../types";

export const subscriptionService = {
  // Toggle subscription
  toggleSubscription: async (
    channelId: string
  ): Promise<{ isSubscribed: boolean; subscribersCount: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ isSubscribed: boolean; subscribersCount: number }>
    >(`/users/toggle-subscription/${channelId}`);
    return response.data.data!;
  },

  // Get user's subscriptions
  getSubscriptions: async (): Promise<User[]> => {
    const response = await apiClient.get<
      ApiResponse<{ subscriptions: Subscription[] }>
    >("/subscriptions/user");
    return response.data.data!.subscriptions.map((sub) => sub.channel);
  },

  // Get channel subscribers
  getSubscribers: async (channelId: string): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<{ subscribers: User[] }>>(
      `/subscriptions/channel/${channelId}`
    );
    return response.data.data!.subscribers;
  },
};
