"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingModerationItems, updateModerationStatus } from "@/lib/dbService";
import styles from "./review.module.css";

export default function AdminReviewPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { items: pendingItems, error: pendingError } = await fetchPendingModerationItems();
      if (pendingError) setError(pendingError);
      setItems(pendingItems || []);
      setLoading(false);
    })();
  }, []);

  const processItem = async (itemId, status) => {
    if (!user?.uid) return;
    setProcessingId(itemId);
    const { error: updateError } = await updateModerationStatus(itemId, status, user.uid);
    if (updateError) {
      alert(`Could not ${status} this item: ${updateError}`);
      setProcessingId(null);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setProcessingId(null);
  };

  const emptyText = useMemo(() => {
    if (loading) return "Loading moderation queue...";
    if (items.length === 0) return "No pending submissions. Great job!";
    return null;
  }, [items.length, loading]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Moderation Queue</h2>
        <p>Review user uploads before they appear publicly.</p>
        <Link href="/admin/items" className={styles.backBtn}>View All Items</Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {emptyText ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.mediaWrap}>
                {item.media_type === "video" ? (
                  <video src={item.media_url} controls className={styles.media} />
                ) : item.media_type === "audio" ? (
                  <audio src={item.media_url} controls className={styles.audio} />
                ) : (
                  <img src={item.media_url} alt={item.title} className={styles.media} />
                )}
              </div>

              <div className={styles.body}>
                <h3>{item.title}</h3>
                <p className={styles.meta}>
                  {item.category || "Uncategorized"} • {item.state || "Unknown state"}
                  {item.is_short ? " • Short" : ""}
                </p>
                {item.description && <p className={styles.desc}>{item.description}</p>}

                <div className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => processItem(item.id, "approved")}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => processItem(item.id, "rejected")}
                    disabled={processingId === item.id}
                  >
                    Reject
                  </button>
                  <Link href={`/item/${item.id}`} className={styles.previewLink}>Preview</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
