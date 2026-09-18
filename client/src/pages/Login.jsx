import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    <div className="min-h-[100dvh] flex items-center justify-center bg-base px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 sm:mb-8 text-center">
          <span className="inline-flex w-11 h-11 rounded-xl bg-accent items-center justify-center text-white text-lg font-bold mb-3 shadow-sm">
            B
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Sign in to Workspace</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">Track your team's projects in one place</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-line rounded-xl sm:rounded-2xl p-5 sm:p-6 space-y-4 shadow-card">
          {error && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-3 border border-line px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
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
            className="w-full bg-accent hover:bg-accent-dark active:bg-accent-dark text-white text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 touch-manipulation shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin -ml-0.5 text-white" />
                <span>Signing in…</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Quick Test Credentials */}
        <div className="mt-5 bg-surface/60 border border-line rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
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
                setPassword("Password123");
                setError("");
                toast.info("Filled PM credentials (admin@workspace.com)");
              }}
              className="flex flex-col items-start p-2.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 active:bg-surface-2 text-left transition-all group touch-manipulation"
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
              className="flex flex-col items-start p-2.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 active:bg-surface-2 text-left transition-all group touch-manipulation"
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

        <p className="text-center text-xs sm:text-sm text-muted mt-4">
          New here?{" "}
          <Link to="/register" className="text-accent-light font-medium hover:underline p-1">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
