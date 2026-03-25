"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAdminInsights } from "@/lib/dbService";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    mediaBreakdown: { image: 0, video: 0, audio: 0, shorts: 0 },
    moderationBreakdown: { approved: 0, pending: 0, rejected: 0 },
    topStates: [],
    latestItemDate: null,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { insights } = await fetchAdminInsights();
        setStats({
          totalItems: insights.totalItems,
          mediaBreakdown: insights.mediaBreakdown,
          moderationBreakdown: insights.moderationBreakdown,
          topStates: insights.topStates,
          latestItemDate: insights.latestItemDate,
          loading: false,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Art Items</h3>
          <p className={styles.statValue}>
            {stats.loading ? "..." : stats.totalItems}
          </p>
          <p className={styles.subText}>
            Latest upload: {stats.latestItemDate?.toDate?.()?.toLocaleDateString("en-IN") || "N/A"}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Media Breakdown</h3>
          <div className={styles.metricList}>
            <p><span>🖼 Images</span><strong>{stats.loading ? "..." : stats.mediaBreakdown.image}</strong></p>
            <p><span>🎬 Videos</span><strong>{stats.loading ? "..." : stats.mediaBreakdown.video}</strong></p>
            <p><span>🎵 Audio</span><strong>{stats.loading ? "..." : stats.mediaBreakdown.audio}</strong></p>
            <p><span>📱 Shorts</span><strong>{stats.loading ? "..." : stats.mediaBreakdown.shorts}</strong></p>
          </div>
        </div>

        <div className={styles.statCard}>
          <h3>Top Contributing States</h3>
          {stats.loading ? (
            <p className={styles.subText}>Loading...</p>
          ) : stats.topStates.length === 0 ? (
            <p className={styles.subText}>No data available</p>
          ) : (
            <ul className={styles.stateList}>
              {stats.topStates.map((entry) => (
                <li key={entry.state}>
                  <span>{entry.state}</span>
                  <strong>{entry.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.statCard}>
          <h3>Moderation Queue</h3>
          <div className={styles.metricList}>
            <p><span>✅ Approved</span><strong>{stats.loading ? "..." : stats.moderationBreakdown.approved}</strong></p>
            <p><span>🕒 Pending</span><strong>{stats.loading ? "..." : stats.moderationBreakdown.pending}</strong></p>
            <p><span>❌ Rejected</span><strong>{stats.loading ? "..." : stats.moderationBreakdown.rejected}</strong></p>
          </div>
          <p className={styles.subText}>
            <Link href="/admin/review">Open moderation queue</Link>
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Quick Actions</h3>
          <ul className={styles.actionList}>
            <li>
              <Link href="/admin/items/new">+ Add New Item</Link>
            </li>
            <li>
              <Link href="/admin/items">Manage Items</Link>
            </li>
            <li>
              <Link href="/shorts">Review Shorts Feed</Link>
            </li>
            <li>
              <Link href="/admin/review">Moderate Pending Items</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
