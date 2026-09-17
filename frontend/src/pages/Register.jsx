import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account.");
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
          <h1 className="text-xl font-semibold text-ink">Create your account</h1>
        </div>

        <form onSubmit={submit} className="bg-surface border border-line rounded-xl p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm text-muted mb-1">Full name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">I am a…</label>
            <select
              value={form.role}
              onChange={update("role")}
              className="w-full rounded-lg bg-surface-3 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              <option value="member">Employee</option>
              <option value="admin">Project manager</option>
            </select>
          </div>
          <button
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent-light font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
