/**
 * SidePanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Slide-in panel with login / register / forgot-password / reset-password
 * and favorites management.
 *
 * Reset-password flow:
 *   The backend emails a link like: https://yourapp.com/auth/reset-password/<token>
 *   On mount we check window.location.pathname for that pattern.
 *   If found we open the panel automatically and show the reset form.
 *   On success (or cancel) we strip the token from the URL via history.replaceState.
 */

import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";

// ── Error translation ─────────────────────────────────────────────────────────
const ERROR_MAP = {
  "All fields must be provided."          : "Wszystkie pola są wymagane.",
  "All fields must be provided"           : "Wszystkie pola są wymagane.",
  "You are already logged in. Log out to create a new account." : "Jesteś już zalogowany. Wyloguj się, aby utworzyć nowe konto.",
  "You are already logged in."            : "Jesteś już zalogowany.",
  "Email already in use."                 : "Ten adres e-mail jest już zajęty.",
  "Incorrect email or password."          : "Nieprawidłowy e-mail lub hasło.",
  "Not logged in."                        : "Nie jesteś zalogowany.",
  "No user found with this id."           : "Nie znaleziono użytkownika.",
  "Token is invalid or expired."          : "Link wygasł lub jest nieprawidłowy. Poproś o nowy.",
  "E-mail must be provided."              : "Adres e-mail jest wymagany.",
  "Password must be provided."            : "Hasło jest wymagane.",
  "Token must be provided."               : "Token jest wymagany.",
  "No user found to delete."              : "Nie znaleziono konta do usunięcia.",
  "There was an error sending the email. Please try again later." : "Błąd wysyłania e-maila. Spróbuj ponownie później.",
  "There was an error sending the email. The account was not deleted. Please try again later." : "Błąd wysyłania e-maila. Konto nie zostało usunięte. Spróbuj ponownie.",
  "No city found with that ID."           : "Nie znaleziono miasta o podanym ID.",
  "Too many requests from this IP, please try again after 15 minutes" : "Zbyt wiele prób. Spróbuj ponownie za 15 minut.",
  "Validation isEmail on email failed"    : "Podaj prawidłowy adres e-mail.",
  "email must be unique"                  : "Ten adres e-mail jest już zajęty.",
  "Failed to fetch"                       : "Brak połączenia z serwerem. Sprawdź internet.",
};

function translateError(message) {
  if (!message) return "Wystąpił nieznany błąd.";
  if (ERROR_MAP[message]) return ERROR_MAP[message];
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "Wystąpił błąd. Spróbuj ponownie.";
}

// ── Detect reset token in URL ─────────────────────────────────────────────────
// Matches: /auth/reset-password/<hex-token>
function getResetTokenFromUrl() {
  const match = window.location.pathname.match(/\/auth\/reset-password\/([a-f0-9]+)/i);
  return match ? match[1] : null;
}

function clearResetTokenFromUrl() {
  window.history.replaceState({}, "", "/");
}

// ── Shared field ──────────────────────────────────────────────────────────────
function Field({ type = "text", placeholder, value, onChange, autoComplete, onKeyDown }) {
  return (
    <input
      className="sp-field"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      onKeyDown={onKeyDown}
    />
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onForgot }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError(translateError("All fields must be provided.")); return; }
    setLoading(true); setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  return (
    <div className="sp-form">
      <h2 className="sp-form-title">Zaloguj się</h2>
      <Field type="email"    placeholder="Email" value={email}    onChange={setEmail}    autoComplete="email"            onKeyDown={handleKey} />
      <Field type="password" placeholder="Hasło" value={password} onChange={setPassword} autoComplete="current-password" onKeyDown={handleKey} />
      {error && <p className="sp-error">{error}</p>}
      <button className="sp-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Logowanie…" : "Zaloguj"}
      </button>
      <button className="sp-btn-ghost" onClick={onSwitch}>
        Nie masz konta? <strong>Zarejestruj się</strong>
      </button>
      <button className="sp-btn-link" onClick={onForgot}>
        Nie pamiętasz hasła?
      </button>
    </div>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const { register } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError(translateError("All fields must be provided.")); return; }
    setLoading(true); setError("");
    try {
      await register(email, password);
      setDone(true);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  if (done) return (
    <div className="sp-form">
      <h2 className="sp-form-title">Gotowe!</h2>
      <p className="sp-hint">Konto zostało utworzone. Możesz się teraz zalogować.</p>
      <button className="sp-btn-primary" onClick={onSwitch}>Zaloguj się</button>
    </div>
  );

  return (
    <div className="sp-form">
      <h2 className="sp-form-title">Rejestracja</h2>
      <Field type="email"    placeholder="Email" value={email}    onChange={setEmail}    autoComplete="email"        onKeyDown={handleKey} />
      <Field type="password" placeholder="Hasło" value={password} onChange={setPassword} autoComplete="new-password" onKeyDown={handleKey} />
      {error && <p className="sp-error">{error}</p>}
      <button className="sp-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Tworzenie konta…" : "Zarejestruj"}
      </button>
      <button className="sp-btn-ghost" onClick={onSwitch}>
        Masz już konto? <strong>Zaloguj się</strong>
      </button>
    </div>
  );
}

// ── Forgot password form ──────────────────────────────────────────────────────
function ForgotPasswordForm({ onBack }) {
  const [email, setEmail]   = useState("");
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) { setError(translateError("E-mail must be provided.")); return; }
    setLoading(true); setError("");
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  if (done) return (
    <div className="sp-form">
      <h2 className="sp-form-title">Sprawdź skrzynkę</h2>
      <p className="sp-hint">
        Jeśli konto o podanym adresie istnieje, wysłaliśmy link do resetowania hasła.
        Sprawdź też folder spam.
      </p>
      <button className="sp-btn-primary" onClick={onBack}>Wróć do logowania</button>
    </div>
  );

  return (
    <div className="sp-form">
      <h2 className="sp-form-title">Resetowanie hasła</h2>
      <p className="sp-hint sp-hint--mb">Podaj adres e-mail powiązany z kontem, a wyślemy Ci link do resetowania hasła.</p>
      <Field type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" onKeyDown={handleKey} />
      {error && <p className="sp-error">{error}</p>}
      <button className="sp-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Wysyłanie…" : "Wyślij link"}
      </button>
      <button className="sp-btn-ghost" onClick={onBack}>
        ← Wróć do logowania
      </button>
    </div>
  );
}

// ── Reset password form (token from URL) ──────────────────────────────────────
function ResetPasswordForm({ token, onDone }) {
  const [password, setPassword]     = useState("");
  const [password2, setPassword2]   = useState("");
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  async function handleSubmit() {
    if (!password || !password2) { setError(translateError("All fields must be provided.")); return; }
    if (password !== password2)  { setError("Hasła nie są identyczne."); return; }
    setLoading(true); setError("");
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      clearResetTokenFromUrl();
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  if (done) return (
    <div className="sp-form">
      <h2 className="sp-form-title">Hasło zmienione!</h2>
      <p className="sp-hint">Możesz się teraz zalogować przy użyciu nowego hasła.</p>
      <button className="sp-btn-primary" onClick={onDone}>Zaloguj się</button>
    </div>
  );

  return (
    <div className="sp-form">
      <h2 className="sp-form-title">Nowe hasło</h2>
      <p className="sp-hint sp-hint--mb">Wpisz nowe hasło dla swojego konta.</p>
      <Field type="password" placeholder="Nowe hasło"       value={password}  onChange={setPassword}  autoComplete="new-password"     onKeyDown={handleKey} />
      <Field type="password" placeholder="Powtórz hasło"    value={password2} onChange={setPassword2} autoComplete="new-password"     onKeyDown={handleKey} />
      {error && <p className="sp-error">{error}</p>}
      <button className="sp-btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Zapisywanie…" : "Ustaw nowe hasło"}
      </button>
      <button className="sp-btn-ghost" onClick={() => { clearResetTokenFromUrl(); onDone(); }}>
        Anuluj
      </button>
    </div>
  );
}

// ── Logged-in panel ───────────────────────────────────────────────────────────
function LoggedInPanel({ onCitySelect, onClose }) {
  const { logout, deleteAccount, favorites, removeFavorite } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  async function handleLogout() {
    setLoading(true); setError("");
    try { await logout(); } catch (e) { setError(translateError(e.message)); } finally { setLoading(false); }
  }

  async function handleDelete() {
    setLoading(true); setError("");
    try { await deleteAccount(); } catch (e) { setError(translateError(e.message)); } finally { setLoading(false); }
  }

  async function handleRemove(cityId) {
    try { await removeFavorite(cityId); } catch (e) { setError(translateError(e.message)); }
  }

  return (
    <div className="sp-logged">
      <h2 className="sp-form-title">Ulubione miasta</h2>

      {favorites.length === 0 ? (
        <p className="sp-hint">Brak ulubionych miast. Wyszukaj miasto i kliknij ★ aby dodać.</p>
      ) : (
        <ul className="sp-fav-list">
          {favorites.map(city => (
            <li key={city.id} className="sp-fav-item">
              <button
                className="sp-fav-name"
                onClick={() => { onCitySelect({ name: city.name, lat: city.latitude, lon: city.longitude }); onClose(); }}
              >
                <span className="sp-fav-icon">☁</span>
                {city.name}
              </button>
              <button className="sp-fav-remove" onClick={() => handleRemove(city.id)} title="Usuń z ulubionych">✕</button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="sp-error">{error}</p>}

      <div className="sp-account-actions">
        <button className="sp-btn-primary" onClick={handleLogout} disabled={loading}>
          {loading ? "…" : "Wyloguj"}
        </button>
        {!confirmDelete ? (
          <button className="sp-btn-danger-ghost" onClick={() => setConfirmDelete(true)}>Usuń konto</button>
        ) : (
          <div className="sp-confirm">
            <p className="sp-confirm-text">Na pewno? Tej operacji nie można cofnąć.</p>
            <div className="sp-confirm-row">
              <button className="sp-btn-danger" onClick={handleDelete} disabled={loading}>Tak, usuń</button>
              <button className="sp-btn-ghost"  onClick={() => setConfirmDelete(false)}>Anuluj</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main SidePanel ────────────────────────────────────────────────────────────
// mode: "login" | "register" | "forgot" | "reset"
export default function SidePanel({ open, onClose, onCitySelect, forceOpen }) {
  const { user, authLoading } = useAuth();
  const [mode, setMode]       = useState("login");
  const [resetToken, setResetToken] = useState(null);

  // On mount: detect reset token in URL and open panel automatically
  useEffect(() => {
    const token = getResetTokenFromUrl();
    if (token) {
      setResetToken(token);
      setMode("reset");
      forceOpen?.();
    }
  }, []);

  return (
    <>
      <div
        className={`sp-backdrop ${open ? "sp-backdrop--visible" : ""}`}
        onClick={onClose}
      />
      <div className={`sp-panel ${open ? "sp-panel--open" : ""}`}>
        <div className="sp-header">
          <span className="sp-logo">Meteocast</span>
          <button className="sp-close" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>
        <div className="sp-body">
          {authLoading ? (
            <p className="sp-hint">Ładowanie…</p>
          ) : user ? (
            <LoggedInPanel onCitySelect={onCitySelect} onClose={onClose} />
          ) : mode === "reset" ? (
            <ResetPasswordForm
              token={resetToken}
              onDone={() => setMode("login")}
            />
          ) : mode === "forgot" ? (
            <ForgotPasswordForm onBack={() => setMode("login")} />
          ) : mode === "register" ? (
            <RegisterForm onSwitch={() => setMode("login")} />
          ) : (
            <LoginForm
              onSwitch={() => setMode("register")}
              onForgot={() => setMode("forgot")}
            />
          )}
        </div>
      </div>
    </>
  );
}
