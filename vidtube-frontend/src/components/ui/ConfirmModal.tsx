import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) => {
  const handleConfirm = () => {
    onConfirm();
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                  type === "danger" && "bg-red-500/20",
                  type === "warning" && "bg-yellow-500/20",
                  type === "info" && "bg-blue-500/20"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "w-6 h-6",
                    type === "danger" && "text-red-500",
                    type === "warning" && "text-yellow-500",
                    type === "info" && "text-blue-500"
                  )}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {title}
              </h3>
              <p className="text-text-secondary mb-6">{message}</p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button onClick={onClose} className="btn-ghost px-6 py-2">
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "px-6 py-2 rounded-xl font-medium transition-all",
                    type === "danger" &&
                      "bg-red-500 hover:bg-red-600 text-white",
                    type === "warning" &&
                      "bg-yellow-500 hover:bg-yellow-600 text-white",
                    type === "info" && "btn-primary"
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
