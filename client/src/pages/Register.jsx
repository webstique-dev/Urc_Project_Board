import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Select from "../components/ui/Select.jsx";

const ROLE_OPTIONS = [
  { value: "member", label: "Employee", sublabel: "Work on tasks and update progress" },
  { value: "admin", label: "Project manager", sublabel: "Create projects, manage boards and members" },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
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
      toast.success("Account created successfully!", { title: "Welcome" });
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't create your account.";
      setError(msg);
      toast.error(msg, { title: "Registration failed" });
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
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Create your account</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">Get started with your project workspace</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-line rounded-xl sm:rounded-2xl p-5 sm:p-6 space-y-4 shadow-card">
          {error && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Full name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Your full name"
              className="w-full rounded-lg bg-surface-3 border border-line px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
              className="w-full rounded-lg bg-surface-3 border border-line px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Password</label>
            <PasswordInput
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">I am a…</label>
            <Select
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(val) => setForm({ ...form, role: val })}
              placeholder="Select your role"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark active:bg-accent-dark text-white text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-60 touch-manipulation shadow-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin -ml-0.5 text-white" />}
            <span>{loading ? "Creating account…" : "Create account"}</span>
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-muted mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent-light font-medium hover:underline p-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
