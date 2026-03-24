"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../lib/authService";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    setMenuOpen(false);
  };

  const isActive = (href) => pathname === href;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <span className={styles.logoIcon}>🪔</span>
          <span className={styles.logoText}>HeritageNest</span>
        </Link>

        <div className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
          <Link href="/" className={`${styles.link} ${isActive("/") ? styles.activeLink : ""}`} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/categories" className={`${styles.link} ${isActive("/categories") ? styles.activeLink : ""}`} onClick={() => setMenuOpen(false)}>Categories</Link>
          {user && (
            <Link href="/upload" className={`${styles.link} ${isActive("/upload") ? styles.activeLink : ""}`} onClick={() => setMenuOpen(false)}>Upload</Link>
          )}
          <Link href="/about" className={`${styles.link} ${isActive("/about") ? styles.activeLink : ""}`} onClick={() => setMenuOpen(false)}>About</Link>
        </div>

        <div className={styles.actions}>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.avatarBtn} onClick={() => setMenuOpen(false)}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className={styles.avatar} />
                ) : (
                  <span className={styles.avatarInitial}>{user.email?.[0]?.toUpperCase()}</span>
                )}
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <Link href="/auth/login" className={styles.signInBtn} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
