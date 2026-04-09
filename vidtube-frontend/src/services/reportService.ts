import apiClient from "./apiClient";

export interface ReportData {
  contentType: "video" | "comment" | "user";
  contentId: string;
  reason: string;
  description?: string;
}

export const reportService = {
  // Submit a report
  createReport: async (data: ReportData): Promise<void> => {
    await apiClient.post("/reports", data);
  },

  // Get user's reports (if user is admin)
  getReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<unknown> => {
    const response = await apiClient.get("/reports", { params });
    return response.data.data;
  },
};
