import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { onNetworkActivityChange } from "../../api/axios.js";

/**
 * Modern ultra-slim top progress bar with warm amber/stone gradient
 * Provides immediate feedback on route transitions and active API requests.
 */
export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isNetworkActive, setIsNetworkActive] = useState(false);
  const timerRef = useRef(null);
  const finishTimerRef = useRef(null);

  // Subscribe to Axios network requests
  useEffect(() => {
    return onNetworkActivityChange((active) => {
      setIsNetworkActive(active);
    });
  }, []);

  // Trigger progress on route change
  useEffect(() => {
    startProgress();
    const timeout = setTimeout(() => {
      completeProgress();
    }, 250);
    return () => clearTimeout(timeout);
  }, [location.pathname, location.search]);

  // Trigger progress on network active change
  useEffect(() => {
    if (isNetworkActive) {
      startProgress();
    } else {
      completeProgress();
    }
  }, [isNetworkActive]);

  const startProgress = () => {
    clearTimeout(finishTimerRef.current);
    clearInterval(timerRef.current);
    setVisible(true);
    setProgress((prev) => (prev > 0 && prev < 80 ? prev : 15));

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) return prev + Math.random() * 12 + 6;
        if (prev < 85) return prev + Math.random() * 4 + 2;
        if (prev < 93) return prev + 0.5;
        return prev;
      });
    }, 120);
  };

  const completeProgress = () => {
    clearInterval(timerRef.current);
    setProgress(100);
    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] pointer-events-none h-[2.5px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-stone-800 to-amber-600 shadow-[0_0_8px_rgba(180,83,9,0.5)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms ease 100ms" : "width 200ms ease",
        }}
      />
    </div>
  );
}
