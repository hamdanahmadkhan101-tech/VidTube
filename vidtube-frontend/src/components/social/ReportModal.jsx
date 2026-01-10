import React, { useState } from "react";
import { X, Flag, AlertTriangle } from "lucide-react";
import { createReport } from "../../services/reportService";
import toast from "react-hot-toast";

const REPORT_REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "sexual", label: "Sexual content" },
  { id: "violent", label: "Violent or repulsive content" },
  { id: "hateful", label: "Hateful or abusive content" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "harmful", label: "Harmful or dangerous acts" },
  { id: "child_abuse", label: "Child abuse" },
  { id: "infringement", label: "Legal issue / Infringement" },
  { id: "other", label: "Other" },
];

const ReportModal = ({ isOpen, onClose, targetId, type = "video" }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        type,
        reportedItem: targetId,
        reason,
        description,
      });
      toast.success(
        "Report submitted successfully. Thank you for your feedback."
      );
      onClose();
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <div className="flex items-center gap-2 text-red-500">
            <Flag className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-white">Report {type}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              What's the issue with this {type}?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    reason === r.id
                      ? "bg-red-500/10 border-red-500/50 text-white"
                      : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              className="w-full min-h-[100px] rounded-lg bg-gray-800 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-xs text-yellow-200/80">
              Abusing the report system may lead to account restrictions. Please
              use it responsibly.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
