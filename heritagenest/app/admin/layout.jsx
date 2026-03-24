"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./admin.module.css";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !userDoc?.isAdmin)) {
      router.push("/auth/login");
    }
  }, [user, userDoc, loading, router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !userDoc?.isAdmin) {
    return (
      <div className={styles.container}>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>⚙️ Admin Panel</div>
        <ul className={styles.navList}>
          <li>
            <Link href="/admin" className={styles.navLink}>
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/items" className={styles.navLink}>
              📋 Manage Items
            </Link>
          </li>
          <li>
            <Link href="/admin/items/new" className={styles.navLink}>
              ➕ Add New Item
            </Link>
          </li>
          <li>
            <Link href="/" className={styles.navLink}>
              🔙 Back to Site
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Admin Dashboard</h1>
          <div className={styles.userInfo}>
            <span>👤 {user.email}</span>
          </div>
        </header>

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
