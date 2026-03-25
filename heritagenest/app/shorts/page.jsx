"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { fetchShortVideos, fetchUserUploads } from "../../lib/dbService";
import { useAuth } from "../../context/AuthContext";
import styles from "./shorts.module.css";

function formatDuration(value) {
  if (!value || Number.isNaN(value)) return "0:00";
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ShortsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [likedMap, setLikedMap] = useState({});
  const videoRefs = useRef({});
  const feedRef = useRef(null);

  const goToNextShort = (currentId) => {
    const currentIndex = items.findIndex((it) => it.id === currentId);
    if (currentIndex === -1 || currentIndex >= items.length - 1) {
      const firstId = items[0]?.id;
      const firstVideo = firstId ? videoRefs.current[firstId] : null;
      if (firstVideo) {
        setActiveId(firstId);
        firstVideo.currentTime = 0;
        firstVideo.play().catch(() => {});
      }
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const nextItem = items[currentIndex + 1];
    const nextVideo = videoRefs.current[nextItem.id];
    if (feedRef.current) {
      const nextCard = feedRef.current.querySelector(`[data-id='${nextItem.id}']`);
      if (nextCard) {
        nextCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    if (nextVideo) {
      setActiveId(nextItem.id);
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});
    }
  };

  const loadShorts = async () => {
    setLoading(true);
    setError("");
    const { items: shortItems, error: fetchError } = await fetchShortVideos();
    const publicShorts = shortItems || [];

    let ownShorts = [];
    if (user?.uid) {
      const { items: myItems } = await fetchUserUploads(user.uid);
      ownShorts = (myItems || []).filter((item) => item.media_type === "video" && item.is_short === true);
    }

    const mergedMap = new Map();
    [...ownShorts, ...publicShorts].forEach((item) => {
      if (!item?.id) return;
      if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
    });

    const merged = Array.from(mergedMap.values());

    if (fetchError && merged.length === 0) {
      setItems([]);
      setError(fetchError || "Could not load shorts.");
    } else {
      setItems(merged);
    }
    setLoading(false);
  };

  const formatCompact = (value) => {
    const num = Number(value) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  const handleLikeToggle = (id) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareShort = async (item) => {
    const url = `${window.location.origin}/item/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Share is optional. Ignore cancellation/errors silently.
    }
  };

  useEffect(() => {
    const savedMuted = window.localStorage.getItem("shorts-muted");
    if (savedMuted === "0") setMuted(false);
    if (savedMuted === "1") setMuted(true);
    loadShorts();
  }, [user?.uid]);

  useEffect(() => {
    window.localStorage.setItem("shorts-muted", muted ? "1" : "0");
  }, [muted]);

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.id;
          const video = videoRefs.current[id];
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            setActiveId(id);
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.3, 0.7, 1] }
    );

    const cards = document.querySelectorAll("[data-short-card='true']");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const firstId = items[0]?.id;
    if (!firstId) return;

    const firstVideo = videoRefs.current[firstId];
    if (!firstVideo) return;

    const timer = setTimeout(() => {
      setActiveId(firstId);
      firstVideo.play().catch(() => {
        setMuted(true);
        firstVideo.muted = true;
        firstVideo.play().catch(() => {});
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        Object.values(videoRefs.current).forEach((video) => video?.pause());
      } else if (activeId && videoRefs.current[activeId]) {
        videoRefs.current[activeId].play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!feedRef.current) return;

      if (event.key.toLowerCase() === "m") {
        setMuted((prev) => !prev);
        return;
      }

      const step = Math.max(280, Math.round(feedRef.current.clientHeight * 0.88));

      if (event.key === "ArrowDown") {
        event.preventDefault();
        feedRef.current.scrollBy({ top: step, behavior: "smooth" });
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        feedRef.current.scrollBy({ top: -step, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Heritage Shorts</h1>
        <p>Quick vertical stories of folk art, craft, and performance traditions.</p>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.muteBtn}
            onClick={() => setMuted((prev) => !prev)}
          >
            {muted ? "🔇 Unmute Feed" : "🔊 Mute Feed"}
          </button>
          <Link href="/upload?short=1" className={styles.uploadLink}>+ Add Yours</Link>
        </div>
        <p className={styles.controlsHint}>Use ↑ ↓ to browse shorts • Press M to mute/unmute</p>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ marginTop: 80 }} />
      ) : error ? (
        <div className={styles.errorBox}>
          <h2>Could not load shorts</h2>
          <p>{error}</p>
          <button type="button" onClick={loadShorts} className={styles.retryBtn}>Retry</button>
        </div>
      ) : !hasItems ? (
        <div className={styles.empty}>
          <h2>No shorts yet</h2>
          <p>Be the first contributor to share a short cultural video.</p>
          <Link href="/upload" className="btn-primary">Upload Now</Link>
        </div>
      ) : (
        <div className={styles.feed} ref={feedRef}>
          {items.map((item, index) => (
            <Fragment key={`short-block-${item.id}`}>
            <article
              className={styles.shortCard}
              data-short-card="true"
              data-id={item.id}
            >
              <video
                ref={(el) => {
                  if (el) videoRefs.current[item.id] = el;
                }}
                src={item.media_url}
                className={styles.video}
                muted={muted}
                playsInline
                controls={false}
                preload="metadata"
                onEnded={() => goToNextShort(item.id)}
              />

              <div className={styles.overlay}>
                <div className={styles.badges}>
                  <span className={styles.shortBadge}>Short</span>
                  {item.state && <span className={styles.stateBadge}>{item.state}</span>}
                </div>

                <h3>{item.title}</h3>

                <p className={styles.meta}>
                  {item.art_form || "Traditional Performance"}
                  {item.duration_seconds ? ` • ${formatDuration(item.duration_seconds)}` : ""}
                  {typeof item.views === "number" ? ` • ${formatCompact(item.views)} views` : ""}
                  {item.moderation_status === "pending" ? " • Pending review" : ""}
                  {item.moderation_status === "rejected" ? " • Rejected" : ""}
                  {activeId === item.id ? " • Playing" : ""}
                </p>

                <div className={styles.actions}>
                  <Link href={`/item/${item.id}`} className={styles.detailBtn}>View Details</Link>
                </div>
              </div>

              <div className={styles.actionRail}>
                <Link href={`/item/${item.id}`} className={styles.railBtn} aria-label="View short details">↗</Link>
                <button
                  type="button"
                  className={`${styles.railBtn} ${likedMap[item.id] ? styles.railBtnActive : ""}`}
                  aria-label="Like short"
                  onClick={() => handleLikeToggle(item.id)}
                >
                  ♥
                </button>
                <button
                  type="button"
                  className={styles.railBtn}
                  aria-label="Share short"
                  onClick={() => handleShareShort(item)}
                >
                  ⤴
                </button>
              </div>
            </article>
            </Fragment>
          ))}

          <Link href="/upload?short=1" className={styles.sideCreateBtn} aria-label="Add your short">
            <span className={styles.sideCreateIcon}>＋</span>
            <span>Add Yours</span>
          </Link>
        </div>
      )}
    </div>
  );
}
