import { AlertCircle, LoaderCircle, ShieldAlert, UserRoundX } from "lucide-react";
import { Button, Card } from "./ui";

const icons = {
  loading: LoaderCircle,
  config: AlertCircle,
  missing: UserRoundX,
  inactive: ShieldAlert,
  branch: AlertCircle,
  error: AlertCircle,
};

function AuthStateScreen({
  tone = "error",
  title,
  description,
  action,
}) {
  const Icon = icons[tone] ?? AlertCircle;
  const iconClassName =
    tone === "loading"
      ? "animate-spin text-taste-text"
      : tone === "inactive"
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-taste-background px-4 py-10">
      <Card className="w-full max-w-lg p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-taste-border">
          <Icon size={26} className={iconClassName} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-taste-text">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-taste-muted">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </Card>
    </main>
  );
}

export function AuthStateAction({ label, onClick, variant = "default" }) {
  return (
    <Button variant={variant} onClick={onClick}>
      {label}
    </Button>
  );
}

export default AuthStateScreen;
