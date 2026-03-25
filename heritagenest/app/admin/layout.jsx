"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./admin.module.css";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      <nav className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚙️</span>
            <span className={`${styles.logoText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Admin Panel</span>
          </div>
          <button
            type="button"
            className={styles.sidebarToggleBtn}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            {isSidebarCollapsed ? "☰" : "−"}
          </button>
        </div>
        <ul className={styles.navList}>
          <li>
            <Link href="/admin" className={styles.navLink}>
              <span className={styles.navIcon}>📊</span>
              <span className={`${styles.navText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/items" className={styles.navLink}>
              <span className={styles.navIcon}>📋</span>
              <span className={`${styles.navText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Manage Items</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/items/new" className={styles.navLink}>
              <span className={styles.navIcon}>➕</span>
              <span className={`${styles.navText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Add New Item</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/review" className={styles.navLink}>
              <span className={styles.navIcon}>✅</span>
              <span className={`${styles.navText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Review Queue</span>
            </Link>
          </li>
          <li>
            <Link href="/" className={styles.navLink}>
              <span className={styles.navIcon}>🔙</span>
              <span className={`${styles.navText} ${isSidebarCollapsed ? styles.hiddenText : ""}`}>Back to Site</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className={`${styles.content} ${isSidebarCollapsed ? styles.contentExpanded : ""}`}>
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
