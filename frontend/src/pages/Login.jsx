import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!", { title: "Signed In" });
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't sign in. Check your details.";
      setError(msg);
      toast.error(msg, { title: "Sign in failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex w-10 h-10 rounded-lg bg-accent items-center justify-center text-white font-semibold mb-3">
            B
          </span>
          <h1 className="text-xl font-semibold text-ink">Sign in to Workspace</h1>
          <p className="text-sm text-muted mt-1">Track your team's projects in one place</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-line rounded-xl p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm text-muted mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm text-muted mb-1">
              Password
            </label>
            <PasswordInput
              id="login-password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-0.5 w-4 h-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Quick Test Credentials */}
        <div className="mt-6 bg-surface/60 border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Quick Test Credentials
            </span>
            <span className="text-[10px] text-accent-light bg-accent/15 px-2 py-0.5 rounded-full font-medium">
              Click to fill
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@workspace.com");
                setPassword("password123");
                setError("");
                toast.info("Filled PM credentials (admin@workspace.com)");
              }}
              className="flex flex-col items-start p-2.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-medium text-ink group-hover:text-accent-light">
                  Project Manager
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-light font-mono font-semibold">
                  PM
                </span>
              </div>
              <span className="text-[11px] text-muted font-mono truncate w-full">
                admin@workspace.com
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("member@workspace.com");
                setPassword("password123");
                setError("");
                toast.info("Filled Member credentials (member@workspace.com)");
              }}
              className="flex flex-col items-start p-2.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-medium text-ink group-hover:text-accent-light">
                  Employee
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted font-mono font-semibold">
                  MEMBER
                </span>
              </div>
              <span className="text-[11px] text-muted font-mono truncate w-full">
                member@workspace.com
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          New here?{" "}
          <Link to="/register" className="text-accent-light font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
