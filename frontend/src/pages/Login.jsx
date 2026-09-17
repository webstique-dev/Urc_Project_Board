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
            <label className="block text-sm text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

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
