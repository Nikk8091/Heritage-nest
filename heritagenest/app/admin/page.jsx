"use client";
import { useEffect, useState } from "react";
import { fetchArtItems } from "@/lib/dbService";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { items } = await fetchArtItems();
        setStats({
          totalItems: items.length,
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
        </div>
        <div className={styles.statCard}>
          <h3>Quick Actions</h3>
          <ul>
            <li>
              <a href="/admin/items/new">+ Add New Item</a>
            </li>
            <li>
              <a href="/admin/items">Manage Items</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
