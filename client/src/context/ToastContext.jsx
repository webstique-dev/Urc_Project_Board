import { createContext, useContext, useState, useCallback } from "react";
import ToastContainer from "../components/ToastContainer.jsx";

const ToastContext = createContext(null);

let toastCount = 0;

export function ToastProvider({ children, defaultPosition = "top-right" }) {
  const [toasts, setToasts] = useState([]);
  const [position, setPosition] = useState(defaultPosition);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = ++toastCount;
    const toastItem = typeof options === "string" 
      ? { id, message: options, type: "info", duration: 4000 }
      : {
          id,
          type: options.type || "info",
          title: options.title || "",
          message: options.message || "",
          duration: options.duration !== undefined ? options.duration : 4000,
          ...options,
        };

    if (options.position) {
      setPosition(options.position);
    }

    setToasts((prev) => [...prev, toastItem]);
    return id;
  }, []);

  const toast = useCallback(
    (messageOrOptions, options = {}) => {
      if (typeof messageOrOptions === "string") {
        return addToast({ message: messageOrOptions, ...options });
      }
      return addToast(messageOrOptions);
    },
    [addToast]
  );

  toast.success = useCallback(
    (message, options = {}) => addToast({ type: "success", message, ...options }),
    [addToast]
  );

  toast.error = useCallback(
    (message, options = {}) => addToast({ type: "error", message, ...options }),
    [addToast]
  );

  toast.warning = useCallback(
    (message, options = {}) => addToast({ type: "warning", message, ...options }),
    [addToast]
  );

  toast.info = useCallback(
    (message, options = {}) => addToast({ type: "info", message, ...options }),
    [addToast]
  );

  toast.dismiss = removeToast;
  toast.clear = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts, position, setPosition }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
