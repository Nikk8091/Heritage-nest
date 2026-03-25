import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🪔 HeritageNest</span>
          <p>Preserving India's cultural heritage digitally — one folk art at a time.</p>
          <p className={styles.tagline}>A digital archive for intangible cultural heritage.</p>
        </div>
        <div className={styles.links}>
          <h4>Explore</h4>
          <Link href="/">Home</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/about">About</Link>
        </div>
        <div className={styles.links}>
          <h4>Account</h4>
          <Link href="/auth/login">Sign In</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/profile">Profile</Link>
        </div>
        <div className={styles.links}>
          <h4>Art Forms</h4>
          <Link href="/categories?cat=Folk Art">Folk Art</Link>
          <Link href="/categories?cat=Dance">Dance</Link>
          <Link href="/categories?cat=Craft">Craft</Link>
          <Link href="/categories?cat=Heritage Site">Heritage Sites</Link>
        </div>
        <div className={styles.links}>
          <h4>Contact</h4>
          <a href="mailto:nikk4645@gmail.com">Overall Manager: nikk4645@gmail.com</a>
          <a href="mailto:swetashr08@gmail.com">Tech Support: swetashr08@gmail.com</a>
          <a href="mailto:swetashr08@gmail.com">General Queries</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2024 HeritageNest. Built to preserve India's intangible cultural heritage.</p>
        <p className={styles.hackathon}>🏆 Hackathon Project</p>
      </div>
    </footer>
  );
}
