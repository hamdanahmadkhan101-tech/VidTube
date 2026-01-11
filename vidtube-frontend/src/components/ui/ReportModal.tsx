import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag } from "lucide-react";
import { cn } from "../../utils/helpers";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
  isSubmitting?: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");

  const reasons = [
    { value: "spam", label: "Spam or misleading" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "hate_speech", label: "Hate speech" },
    { value: "inappropriate_content", label: "Inappropriate content" },
    { value: "copyright", label: "Copyright violation" },
    { value: "violence", label: "Violence or harmful content" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    onSubmit(
      selectedReason,
      selectedReason === "other" || description.trim()
        ? description.trim()
        : undefined
    );
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      Report Video
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Help us understand the problem
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">
                    Why are you reporting this video?
                  </label>
                  <div className="space-y-2">
                    {reasons.map((reason) => (
                      <label
                        key={reason.value}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                          selectedReason === reason.value
                            ? "bg-primary-500/20 border-2 border-primary-500"
                            : "glass-card hover:bg-surface-hover"
                        )}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="text-text-primary text-sm">
                          {reason.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description (optional for most, required for "other") */}
                {(selectedReason === "other" || selectedReason) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-text-primary">
                      Additional details
                      {selectedReason === "other" && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide more details..."
                      className="glass-input w-full min-h-24 resize-none"
                      rows={3}
                      required={selectedReason === "other"}
                    />
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-ghost flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !selectedReason ||
                      isSubmitting ||
                      (selectedReason === "other" && !description.trim())
                    }
                    className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
