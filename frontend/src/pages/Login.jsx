import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Card, FormField, IconButton, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";

function Login() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, login } = useAuth();
  const { currentBranch } = useBranch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (isAuthenticated) return <Navigate to={currentUser.role === "OWNER" && !currentBranch ? "/branches" : "/app/dashboard"} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    setAuthError("");
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      navigate(user.role === "OWNER" ? "/branches" : "/app/dashboard", { replace: true });
    } catch (loginError) {
      setAuthError(loginError.message || "We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-taste-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-16 top-12 h-48 w-48 rounded-full bg-taste-teal/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-4 h-56 w-56 rounded-full bg-taste-purple/15 blur-3xl" />
      <Card className="relative w-full max-w-md p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-taste-teal-soft text-slate-800"><LockKeyhole size={22} /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-taste-purple">Taste It Café</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-taste-text">Welcome back</h1>
        <p className="mt-2 text-base leading-7 text-taste-muted">Sign in to open your branch workspace.</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          {authError && <Alert variant="danger" title="Unable to sign in">{authError}</Alert>}
          <FormField label="Email" required error={errors.email}><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} placeholder="you@tasteit.com" autoComplete="email" disabled={isSubmitting} /></FormField>
          <FormField label="Password" required error={errors.password}><div className="relative"><Input type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} autoComplete="current-password" disabled={isSubmitting} className="pr-11" /><IconButton label={passwordVisible ? "Hide password" : "Show password"} size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" disabled={isSubmitting} onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</IconButton></div></FormField>
          <Button type="submit" loading={isSubmitting} size="lg" className="w-full">Sign in</Button>
        </form>
        <div className="mt-6 border-t border-taste-border pt-5 text-sm leading-6 text-taste-muted"><p className="font-semibold text-taste-text">Prototype accounts</p><p>Owner: owner@tasteit.com</p><p>Staff (Marigondon): staff@tasteit.com</p><p>Staff (Babag): staff.babag@tasteit.com</p><p>Password: tasteit123</p></div>
      </Card>
    </main>
  );
}

export default Login;
