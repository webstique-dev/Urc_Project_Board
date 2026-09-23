import api from "./axios.js";

// Global singleton state for backend readiness
const listeners = new Set();

let readinessState = {
  status: "idle", // 'idle' | 'checking' | 'cold_start' | 'ready' | 'error'
  isColdStart: false,
  attempt: 0,
  maxAttempts: 6,
  elapsedSeconds: 0,
  error: null,
  message: "Connecting to server…",
};

let checkPromise = null;
let abortController = null;
let timerInterval = null;

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ ...readinessState });
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeBackendReadiness(callback) {
  listeners.add(callback);
  callback({ ...readinessState });
  return () => listeners.delete(callback);
}

export function getReadinessState() {
  return { ...readinessState };
}

// Increasing delay backoff schedule (in ms): [1500, 3000, 5000, 8000, 12000, 15000]
// Gives ~45s total window, accommodating Render free dyno cold start
const RETRY_DELAYS = [1500, 3000, 5000, 8000, 12000, 15000];

export async function checkBackendReadiness(force = false) {
  // If already ready and not forcing, return immediately
  if (readinessState.status === "ready" && !force) {
    return true;
  }

  // Deduplicate: if check is already running, return existing in-flight promise
  if (checkPromise && !force) {
    return checkPromise;
  }

  // Cancel any previous in-flight check
  if (abortController) {
    abortController.abort();
  }
  clearInterval(timerInterval);

  abortController = new AbortController();
  const startTime = Date.now();

  readinessState = {
    ...readinessState,
    status: "checking",
    isColdStart: false,
    attempt: 0,
    error: null,
    message: "Connecting to server…",
    elapsedSeconds: 0,
  };
  notify();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    readinessState.elapsedSeconds = elapsed;
    if (elapsed >= 3 && !readinessState.isColdStart && readinessState.status !== "ready") {
      readinessState.isColdStart = true;
      readinessState.status = "cold_start";
      readinessState.message = "Waking up cloud server (Render cold start)…";
    }
    notify();
  }, 1000);

  checkPromise = (async () => {
    for (let i = 0; i < readinessState.maxAttempts; i++) {
      readinessState.attempt = i + 1;
      notify();

      try {
        // Fast ping to health endpoint with short per-request timeout
        await api.get("/health", {
          signal: abortController.signal,
          silentRequest: true,
          timeout: 10000,
        });

        // Backend is ready!
        clearInterval(timerInterval);
        readinessState = {
          ...readinessState,
          status: "ready",
          isColdStart: false,
          error: null,
          message: "Connected",
        };
        notify();
        checkPromise = null;
        return true;
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          clearInterval(timerInterval);
          checkPromise = null;
          return false;
        }

        // If there are more retries left, wait with increasing delay
        if (i < readinessState.maxAttempts - 1) {
          readinessState.isColdStart = true;
          readinessState.status = "cold_start";
          readinessState.message = `Server is booting up (attempt ${i + 1}/${readinessState.maxAttempts})…`;
          notify();

          const delay = RETRY_DELAYS[i] || 5000;
          await new Promise((res) => setTimeout(res, delay));
          if (abortController.signal.aborted) {
            clearInterval(timerInterval);
            checkPromise = null;
            return false;
          }
        } else {
          // All retries exhausted
          clearInterval(timerInterval);
          readinessState = {
            ...readinessState,
            status: "error",
            isColdStart: false,
            error: err.customMessage || "Unable to reach the backend server. The instance may be starting up or sleeping.",
            message: "Connection timed out",
          };
          notify();
          checkPromise = null;
          return false;
        }
      }
    }

    clearInterval(timerInterval);
    checkPromise = null;
    return false;
  })();

  return checkPromise;
}

export function resetBackendReadiness() {
  if (abortController) {
    abortController.abort();
  }
  clearInterval(timerInterval);
  checkPromise = null;
  readinessState = {
    status: "idle",
    isColdStart: false,
    attempt: 0,
    maxAttempts: 6,
    elapsedSeconds: 0,
    error: null,
    message: "Connecting to server…",
  };
  notify();
}
