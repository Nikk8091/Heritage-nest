"use client";
import { useEffect, useMemo, useState } from "react";
import ArtCard from "../../components/ArtCard";
import { fetchAudioItems } from "../../lib/dbService";
import { INDIAN_STATES } from "../../lib/constants";
import styles from "./audio.module.css";

export default function AudioPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  useEffect(() => {
    const loadAudio = async () => {
      setLoading(true);
      const { items: fetchedItems, error: fetchError } = await fetchAudioItems();
      if (fetchError) {
        setError(fetchError);
      } else {
        setItems(fetchedItems || []);
      }
      setLoading(false);
    };

    loadAudio();
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.media_type !== "audio") return false;
      if (stateFilter && item.state !== stateFilter) return false;
      if (!term) return true;
      return (
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [items, query, stateFilter]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Audio Heritage Library</h1>
          <p className={styles.subtitle}>
            Listen to folk songs, oral traditions, narration, and regional sound archives.
          </p>
          <div className={styles.tools}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search audio by title, tags, description"
            />
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          {loading ? (
            <div className="loading-spinner" />
          ) : error ? (
            <p className="error-msg">{error}</p>
          ) : filteredItems.length === 0 ? (
            <div className={styles.empty}>
              <span>🎧</span>
              <p>No audio items found for your filters.</p>
            </div>
          ) : (
            <>
              <p className={styles.count}>{filteredItems.length} audio items</p>
              <div className="grid-3">
                {filteredItems.map((item) => (
                  <ArtCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
