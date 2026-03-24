"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { fetchUserUploads } from "../../lib/dbService";
import ArtCard from "../../components/ArtCard";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { items } = await fetchUserUploads(user.uid);
      setUploads(items);
      setLoading(false);
    })();
  }, [user]);

  const handleItemUpdate = () => {
    console.log("🔄 Item updated, refreshing uploads...");
    if (user) {
      (async () => {
        const { items } = await fetchUserUploads(user.uid);
        setUploads(items);
      })();
    }
  };

  if (authLoading || !user) return <div className="loading-spinner" style={{ marginTop: 80 }} />;

  const displayName = userDoc?.displayName || user.email?.split("@")[0] || "User";
  const states = [...new Set(uploads.map((u) => u.state).filter(Boolean))];
  const categories = [...new Set(uploads.map((u) => u.category).filter(Boolean))];

  return (
    <div className={styles.page}>
      <div className="container">
        {/* ── Profile Card ─────────────────────────── */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {user.photoURL
              ? <img src={user.photoURL} alt="avatar" className={styles.avatar} />
              : <div className={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</div>
            }
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{displayName}</h1>
            <p className={styles.email}>{user.email}</p>
            {userDoc?.created_at && (
              <p className={styles.joined}>
                Member since {userDoc.created_at?.toDate?.()?.toLocaleDateString("en-IN", {
                  year: "numeric", month: "long"
                }) || ""}
              </p>
            )}
          </div>
          <div className={styles.profileActions}>
            <Link href="/upload" className="btn-primary">+ Upload</Link>
            <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────── */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{uploads.length}</span>
            <span className={styles.statLabel}>Contributions</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{userDoc?.saved?.length || 0}</span>
            <span className={styles.statLabel}>Saved Items</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{states.length}</span>
            <span className={styles.statLabel}>States Covered</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{categories.length}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>

        {/* ── States covered ────────────────────────── */}
        {states.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>States Contributed To</h3>
            <div className={styles.tagList}>
              {states.map((s) => (
                <Link key={s} href={`/?state=${s}`} className="tag">{s}</Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Uploads ───────────────────────────────── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>My Contributions ({uploads.length})</h2>
          {loading ? (
            <div className="loading-spinner" />
          ) : uploads.length === 0 ? (
            <div className={styles.empty}>
              <span>🎨</span>
              <p>You haven't uploaded anything yet.</p>
              <Link href="/upload" className="btn-primary">Start Contributing</Link>
            </div>
          ) : (
            <div className="grid-3">
              {uploads.map((item) => <ArtCard key={item.id} item={item} onUpdate={handleItemUpdate} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
