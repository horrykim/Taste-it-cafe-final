import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Checkbox, FormField, IconButton, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import tasteItLogo from "../assets/login/taste-it-logo.svg";
import coffeeCup from "../assets/login/coffee-cup.png";

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
    <main className="min-h-screen bg-[#f5f5f3] p-0">
      <div className="mx-auto flex min-h-screen w-full flex-col overflow-hidden bg-white md:flex-row">
        <aside className="relative flex w-full flex-col items-center justify-start bg-[#A7D2CF] px-4 py-8 text-center md:w-1/2 md:px-6 lg:px-8">
          <div className="flex w-full max-w-[500px] flex-col items-center">
            <img src={tasteItLogo} alt="Taste It logo" className="mb-5 w-[130px] md:w-[150px] lg:w-[170px]" />

            <div className="flex items-baseline justify-center gap-[0.08em] text-[clamp(2.7rem,3vw,4.5rem)] font-black leading-none tracking-[-0.08em]">
              <span className="text-white">TASTE</span>
              <span className="text-[#D17FB2]">IT</span>
            </div>

            <div className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white md:text-[0.78rem] lg:text-[0.9rem]">
              CAFÉ MANAGEMENT SYSTEM
            </div>

            <div className="mt-auto flex w-full max-w-[480px] items-end justify-center pb-0 pt-6 md:pt-8 lg:pt-10">
              <img
                src={coffeeCup}
                alt="Coffee cup"
                className="mb-[-2px] w-[clamp(150px,20vw,240px)] max-w-full object-contain md:w-[clamp(170px,16vw,260px)] lg:w-[clamp(200px,14vw,290px)]"
              />
            </div>
          </div>
        </aside>

        <section className="flex w-full items-center justify-center bg-white px-4 py-6 sm:px-6 md:w-1/2 md:px-8 lg:px-10 xl:px-12">
          <div className="flex min-h-[640px] w-full max-w-[430px] flex-col justify-between">
            <div className="pt-8 md:pt-12 lg:pt-16">
              <h1 className="text-[2.2rem] font-semibold leading-none tracking-[-0.06em] text-[#171717] sm:text-[2.7rem] md:text-[3rem]">
                Welcome <span className="text-[#d77db5]">Back!</span>
              </h1>
              <div className="mt-4 h-[4px] w-[180px] rounded-full bg-[#d77db5]" />
              <p className="mt-5 text-base text-[#6b7280] md:text-lg">Sign in to your Taste It account</p>

              <form className="mt-7 w-full" onSubmit={handleSubmit} noValidate>
                {authError && <div className="mb-5"><Alert variant="danger" title="Unable to sign in">{authError}</Alert></div>}

                <div className="space-y-5">
                  <FormField label="Username / Email" required error={errors.email}>
                    <div className="relative">
                      <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ecbcf]" aria-hidden="true" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={errors.email}
                        placeholder="you@tasteit.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="h-[52px] rounded-xl border-[#bfe4e5] bg-white pl-11 text-[15px] text-[#171717] shadow-none placeholder:text-[#9ca3af] focus:border-[#9dcfcd] focus:ring-4 focus:ring-[#a8d8d5]/25"
                      />
                    </div>
                  </FormField>

                  <FormField label="Password" required error={errors.password}>
                    <div className="relative">
                      <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ecbcf]" aria-hidden="true" />
                      <Input
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        error={errors.password}
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        className="h-[52px] rounded-xl border-[#bfe4e5] bg-white pl-11 pr-12 text-[15px] text-[#171717] shadow-none placeholder:text-[#9ca3af] focus:border-[#9dcfcd] focus:ring-4 focus:ring-[#a8d8d5]/25"
                      />
                      <IconButton
                        label={passwordVisible ? "Hide password" : "Show password"}
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg border border-transparent bg-transparent p-2 text-[#9ecbcf] hover:bg-[#eef9f8] hover:text-[#7bb8bd]"
                        disabled={isSubmitting}
                        onClick={() => setPasswordVisible((visible) => !visible)}
                      >
                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </div>
                  </FormField>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <Checkbox label="Remember Me" className="text-sm text-[#374151]" disabled={isSubmitting} />
                  <button type="button" className="text-sm font-medium text-[#d77db5] transition hover:text-[#c96ca7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d77db5]" aria-label="Forgot password">
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  size="lg"
                  className="mt-7 h-[54px] w-full rounded-xl bg-[#a8d8d5] text-lg font-semibold text-white shadow-none hover:bg-[#9ccdc9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d77db5]"
                >
                  Sign In
                </Button>
              </form>
            </div>

            <footer className="pt-8 text-center text-xs text-[#7a7d82]">
              © 2026 Taste It. All rights reserved.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
