"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchArtItemById, fetchRelatedItems, toggleBookmark } from "../../../lib/dbService";
import { useAuth } from "../../../context/AuthContext";
import ArtCard from "../../../components/ArtCard";
import styles from "./item.module.css";

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userDoc, refreshUserDoc } = useAuth();

  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);

  const isSaved = userDoc?.saved?.includes(id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { item: data, error } = await fetchArtItemById(id);
      if (error || !data) { setLoading(false); return; }
      setItem(data);
      const { items } = await fetchRelatedItems(data.state, data.art_form, id);
      setRelated(items);
      setLoading(false);
    })();
  }, [id]);

  const handleBookmark = async () => {
    if (!user) return router.push("/auth/login");
    setBookmarking(true);
    await toggleBookmark(user.uid, id, isSaved);
    await refreshUserDoc();
    setBookmarking(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.media_url;
    a.download = item.title || "folk-art";
    a.target = "_blank";
    a.click();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) return <div className="loading-spinner" style={{ marginTop: 80 }} />;
  if (!item) return (
    <div className={styles.notFound}>
      <h2>Item not found</h2>
      <Link href="/" className="btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className="container">
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>

        <div className={styles.layout}>
          {/* ── Media ──────────────────────────────────── */}
          <div className={styles.mediaCol}>
            <div className={styles.mediaWrap}>
              {item.media_type === "video" ? (
                <video src={item.media_url} controls className={styles.media} />
              ) : (
                <img src={item.media_url} alt={item.title} className={styles.media} />
              )}
            </div>

            <div className={styles.actions}>
              <button onClick={handleDownload} className="btn-primary">
                ⬇ Download
              </button>
              <button onClick={handleShare} className="btn-secondary">
                🔗 Share
              </button>
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                className={`${styles.bookmarkBtn} ${isSaved ? styles.saved : ""}`}
              >
                {isSaved ? "🔖 Saved" : "🔖 Save"}
              </button>
            </div>
          </div>

          {/* ── Info ───────────────────────────────────── */}
          <div className={styles.infoCol}>
            <div className={styles.badges}>
              {item.category && <span className={styles.badge}>{item.category}</span>}
              {item.art_form && <span className={`${styles.badge} ${styles.badgeYellow}`}>{item.art_form}</span>}
            </div>

            <h1 className={styles.title}>{item.title}</h1>

            <div className={styles.metaGrid}>
              {item.state && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>State</span>
                  <span className={styles.metaValue}>📍 {item.state}</span>
                </div>
              )}
              {item.district && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>District</span>
                  <span className={styles.metaValue}>{item.district}</span>
                </div>
              )}
              {item.community && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Community</span>
                  <span className={styles.metaValue}>👥 {item.community}</span>
                </div>
              )}
              {item.art_form && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Art Form</span>
                  <span className={styles.metaValue}>🎨 {item.art_form}</span>
                </div>
              )}
            </div>

            {item.description && (
              <div className={styles.descSection}>
                <h3>About this piece</h3>
                <p>{item.description}</p>
              </div>
            )}

            {item.tags?.length > 0 && (
              <div className={styles.tagsSection}>
                <h3>Tags</h3>
                <div className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {item.created_at && (
              <p className={styles.date}>
                Added: {item.created_at?.toDate?.()?.toLocaleDateString("en-IN", {
                  year: "numeric", month: "long", day: "numeric"
                }) || ""}
              </p>
            )}
          </div>
        </div>

        {/* ── Related ──────────────────────────────────── */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className="section-title">Related from {item.state}</h2>
            <p className="section-subtitle">More folk art from the same region</p>
            <div className="grid-3">
              {related.slice(0, 3).map((r) => <ArtCard key={r.id} item={r} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
