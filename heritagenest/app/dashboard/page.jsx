"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { fetchUserUploads, fetchBookmarkedItems } from "../../lib/dbService";
import ArtCard from "../../components/ArtCard";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [uploads, setUploads] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab] = useState("uploads");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [uploadsRes, bookmarksRes] = await Promise.all([
        fetchUserUploads(user.uid),
        fetchBookmarkedItems(userDoc?.saved || []),
      ]);
      setUploads(uploadsRes.items);
      setBookmarks(bookmarksRes.items);
      setLoading(false);
    })();
  }, [user, userDoc]);

  if (authLoading || !user) return <div className="loading-spinner" style={{ marginTop: 80 }} />;

  const displayName = userDoc?.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className={styles.page}>
      <div className="container">
        {/* ── Header ─────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.welcome}>
            <div className={styles.avatar}>
              {user.photoURL
                ? <img src={user.photoURL} alt="avatar" />
                : <span>{displayName[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <h1 className={styles.welcomeText}>Welcome back, {displayName}! 👋</h1>
              <p className={styles.welcomeSub}>{user.email}</p>
            </div>
          </div>
          <Link href="/upload" className="btn-primary">+ Upload New</Link>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{uploads.length}</span>
            <span className={styles.statLabel}>Uploads</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{bookmarks.length}</span>
            <span className={styles.statLabel}>Saved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>
              {[...new Set(uploads.map((u) => u.state))].length}
            </span>
            <span className={styles.statLabel}>States Covered</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>
              {[...new Set(uploads.map((u) => u.category))].length}
            </span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>

        {/* ── Quick Actions ───────────────────────────── */}
        <div className={styles.quickActions}>
          <Link href="/upload" className={styles.qBtn}>
            <span>📤</span> Upload Content
          </Link>
          <Link href="/categories" className={styles.qBtn}>
            <span>🗂</span> Browse Categories
          </Link>
          <Link href="/profile" className={styles.qBtn}>
            <span>👤</span> View Profile
          </Link>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "uploads" ? styles.activeTab : ""}`}
            onClick={() => setTab("uploads")}
          >
            My Uploads ({uploads.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "saved" ? styles.activeTab : ""}`}
            onClick={() => setTab("saved")}
          >
            Saved ({bookmarks.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <>
            {tab === "uploads" && (
              uploads.length === 0 ? (
                <div className={styles.empty}>
                  <span>📭</span>
                  <p>No uploads yet.</p>
                  <Link href="/upload" className="btn-primary">Upload your first piece</Link>
                </div>
              ) : (
                <div className="grid-3">
                  {uploads.map((item) => <ArtCard key={item.id} item={item} />)}
                </div>
              )
            )}
            {tab === "saved" && (
              bookmarks.length === 0 ? (
                <div className={styles.empty}>
                  <span>🔖</span>
                  <p>No saved items yet.</p>
                  <Link href="/" className="btn-secondary">Explore folk art</Link>
                </div>
              ) : (
                <div className="grid-3">
                  {bookmarks.map((item) => <ArtCard key={item.id} item={item} />)}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
