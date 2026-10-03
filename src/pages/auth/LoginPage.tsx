import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { homeForRole } from "@/utils/roles";
import { config } from "@/config";
import { Mail, Lock, ArrowRight, Eye, EyeOff, User, Users, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

const DEMO_ACCOUNTS = [
  { email: "rahul@attendflow.in", label: "Rahul", roleLabel: "Employee", icon: <User className="h-4 w-4" /> },
  { email: "priya@attendflow.in", label: "Priya", roleLabel: "Manager", icon: <Users className="h-4 w-4" /> },
  { email: "admin@attendflow.in", label: "Vikram", roleLabel: "Admin", icon: <Shield className="h-4 w-4" /> },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0]!.email);
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(homeForRole(user?.role), { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate]);

  if (isAuthenticated) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(loginUser({ email, password }));
  };

  const fillDemo = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword("password");
  };

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-app">{config.name}</h1>
          <p className="text-sm text-app-muted mt-1">{config.tagline}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-app p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-medium text-app-muted mb-2 uppercase tracking-wide">Quick demo</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => fillDemo(account.email)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    email === account.email
                      ? "bg-primary text-primary-text shadow-sm"
                      : "bg-surface-muted text-app-muted hover:bg-surface-200 dark:hover:bg-surface-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5">{account.icon} {account.label}</span>
                  <span className="opacity-70 text-[10px]">{account.roleLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-app pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.in"
                    className="w-full rounded-xl border border-app bg-surface pl-10 pr-4 py-3 text-sm text-app placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-app mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-app bg-surface pl-10 pr-10 py-3 text-sm text-app placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}