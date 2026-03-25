"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AdminManageModal from "./AdminManageModal";
import styles from "./ArtCard.module.css";

export default function ArtCard({ item, onUpdate }) {
  const { userDoc } = useAuth();
  const {
    id,
    title,
    state,
    art_form,
    category,
    description,
    media_url,
    media_type,
    tags,
    is_short,
    duration_seconds,
    moderation_status,
  } = item;
  const [showManageModal, setShowManageModal] = useState(false);
  const isAdmin = userDoc?.isAdmin;

  const formatDuration = (value) => {
    if (!value || Number.isNaN(value)) return null;
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.mediaWrap}>
          {media_type === "video" ? (
            <video src={media_url} className={styles.media} muted />
          ) : media_type === "audio" ? (
            <div className={styles.audioThumb}>
              <span>🎵 Audio</span>
            </div>
          ) : (
            <img
              src={media_url || "/placeholder.jpg"}
              alt={title}
              className={styles.media}
              onError={(e) => { e.target.src = "/placeholder.jpg"; }}
            />
          )}
          {category && <span className={styles.categoryBadge}>{category}</span>}
          {media_type === "video" && (
            <span className={styles.videoBadge}>{is_short ? "▶ Short" : "▶ Video"}</span>
          )}
          {media_type === "audio" && <span className={styles.audioBadge}>🎵 Audio</span>}
          {moderation_status === "pending" && <span className={styles.statusBadgePending}>Pending Review</span>}
          {moderation_status === "rejected" && <span className={styles.statusBadgeRejected}>Rejected</span>}
          {media_type === "video" && duration_seconds ? (
            <span className={styles.durationTag}>{formatDuration(duration_seconds)}</span>
          ) : null}
          
          {/* Admin Manage Button */}
          {isAdmin && (
            <button
              className={styles.manageBtn}
              onClick={() => setShowManageModal(true)}
              title="Manage this item"
            >
              ⚙️ Manage
            </button>
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.meta}>
            {state && <span className={styles.state}>📍 {state}</span>}
            {art_form && <span className={styles.artForm}>{art_form}</span>}
          </div>
          <h3 className={styles.title}>{title}</h3>
          {description && (
            <p className={styles.desc}>
              {description.slice(0, 90)}{description.length > 90 ? "…" : ""}
            </p>
          )}
          {tags?.length > 0 && (
            <div className={styles.tags}>
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
          <Link href={`/item/${id}`} className={styles.viewBtn}>
            View Details →
          </Link>
        </div>
      </div>

      {/* Manage Modal */}
      <AdminManageModal
        item={item}
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}
