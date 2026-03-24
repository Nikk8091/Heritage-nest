"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "../../../lib/authService";
import styles from "./auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let result;
    if (isLogin) {
      result = await loginWithEmail(form.email, form.password);
    } else {
      result = await registerWithEmail(form.email, form.password, form.name);
    }
    setLoading(false);
    if (result.error) return setError(result.error);
    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.error) return setError(result.error);
    router.push("/dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}>🪔</span>
          <h1 className={styles.logoTitle}>HeritageNest</h1>
          <p className={styles.logoSub}>Regional Folk Art Digital Archive</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${isLogin ? styles.activeTab : ""}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >Sign In</button>
          <button
            className={`${styles.tab} ${!isLogin ? styles.activeTab : ""}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label>Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handle}
                required
              />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
              minLength={6}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <button onClick={handleGoogle} className={styles.googleBtn} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
