import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useNavigate } from "@/shared/routing";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { SiTelegram, SiVk } from "@icons-pack/react-simple-icons";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
      <path d="M13.706 19H11.6V9.544H10.76c-1.484 0-2.266.716-2.266 1.894 0 1.356.602 1.988 1.834 2.83L11.42 15.2 8.67 19H6.424l2.996-4.574c-1.694-1.192-2.658-2.352-2.658-4.356 0-2.464 1.694-4.07 4.96-4.07h2.984V19z" fill="white"/>
    </svg>
  );
}

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [timeLeft, setTimeLeft] = useState(3 * 24 * 3600);

  useEffect(() => {
    const saved = localStorage.getItem("era2_signup_timer_start");
    if (!saved) {
      localStorage.setItem("era2_signup_timer_start", String(Date.now()));
    } else {
      const elapsed = Math.floor((Date.now() - parseInt(saved)) / 1000);
      setTimeLeft(Math.max(0, 3 * 24 * 3600 - elapsed));
    }
    const interval = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  useEffect(() => {
    document.title = mode === "login" ? "ERA2 — Вход" : "ERA2 — Регистрация";
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate({ to: "/" });
  };

  const handleSocial = () => {
    login();
    navigate({ to: "/" });
  };

  const SocialButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <button
      type="button"
      onClick={handleSocial}
      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[14px] text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-accent/40"
      style={{
        background: "hsl(var(--secondary))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const inputStyle = {
    background: "hsl(var(--secondary))",
    border: "1px solid hsl(var(--border))",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,84,32,0.12) 0%, transparent 60%), hsl(var(--background))",
      }}
    >
      <div
        className="w-full max-w-md rounded-[22px] p-8 shadow-xl"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)",
            boxShadow: "0 8px 22px -8px rgba(232,84,32,0.55)",
          }}
        >
          E
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          {mode === "login" ? "Вход в ERA2" : "Создать аккаунт"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-7">
          {mode === "login"
            ? "90+ нейросетей в одном месте"
            : "Получите 100 бесплатных кредитов при регистрации"}
        </p>

        {mode === "register" && (
          <div
            className="rounded-[12px] p-3 text-center mb-4"
            style={{
              background: "rgba(232,84,32,0.1)",
              border: "1px solid rgba(232,84,32,0.2)",
            }}
          >
            <div className="text-[13px] font-medium" style={{ color: "hsl(var(--primary))" }}>
              +100 кредитов на 3 дня для генерации!
            </div>
            <div className="text-xl font-mono font-bold mt-1 text-foreground">
              {pad(hours)} : {pad(mins)} : {pad(secs)}
            </div>
          </div>
        )}

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <SocialButton icon={<SiTelegram size={18} color="#26A5E4" />} label="Telegram" />
          <SocialButton icon={<YandexIcon />} label="Яндекс" />
          <SocialButton icon={<GoogleIcon />} label="Google" />
          <SocialButton icon={<SiVk size={18} color="#0077FF" />} label="VK" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">или по email</span>
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-[14px] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
                style={inputStyle}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-[14px] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
              style={inputStyle}
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-[14px] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Забыли пароль?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[14px] text-sm font-semibold text-white transition-all hover:opacity-95"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)",
              boxShadow: "0 8px 22px -8px rgba(232,84,32,0.55)",
            }}
          >
            <span>{mode === "login" ? "Войти" : "Создать аккаунт"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>

        {/* Footer */}
        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          Регистрируясь, вы соглашаетесь с{" "}
          <a href="#" className="underline hover:text-foreground">обработкой персональных данных</a>{" "}
          и{" "}
          <a href="#" className="underline hover:text-foreground">условиями использования</a>.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
