"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchFilteredItems } from "../../lib/dbService";
import { CATEGORIES, INDIAN_STATES, ART_FORMS } from "../../lib/constants";
import ArtCard from "../../components/ArtCard";
import styles from "./categories.module.css";

const CATEGORY_ICONS = {
  "Folk Art": "🎨", "Dance": "💃", "Heritage Site": "🏛",
  "Craft": "🧵", "Festival": "🎉", "Music": "🎵",
  "Textile": "🪡", "Sculpture": "🗿",
};

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "";

  const [selected, setSelected] = useState(initialCat);
  const [filters, setFilters] = useState({ state: "", art_form: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = async (reset = false) => {
    setLoading(true);
    const cursor = reset ? null : lastDoc;
    const result = await fetchFilteredItems(
      { category: selected, ...filters },
      cursor
    );
    if (reset) setItems(result.items);
    else setItems((prev) => [...prev, ...result.items]);
    setLastDoc(result.lastVisible);
    setHasMore(result.items.length === 12);
    setLoading(false);
  };

  useEffect(() => {
    setLastDoc(null);
    loadItems(true);
  }, [selected, filters]);

  const handleFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setLastDoc(null);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">Browse by Category</h1>
          <p className="section-subtitle">Explore India's rich cultural heritage across art forms</p>
        </div>

        {/* Category Pills */}
        <div className={styles.pills}>
          <button
            className={`${styles.pill} ${!selected ? styles.activePill : ""}`}
            onClick={() => setSelected("")}
          >
            🌐 All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.pill} ${selected === cat ? styles.activePill : ""}`}
              onClick={() => setSelected(cat)}
            >
              {CATEGORY_ICONS[cat] || "🎭"} {cat}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Filters</h3>

            <div className={styles.filterGroup}>
              <label>State</label>
              <select value={filters.state} onChange={(e) => handleFilter("state", e.target.value)}>
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Art Form</label>
              <select value={filters.art_form} onChange={(e) => handleFilter("art_form", e.target.value)}>
                <option value="">All Art Forms</option>
                {ART_FORMS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {(filters.state || filters.art_form) && (
              <button
                className={styles.clearBtn}
                onClick={() => setFilters({ state: "", art_form: "" })}
              >
                Clear Filters
              </button>
            )}
          </aside>

          {/* Grid */}
          <div className={styles.content}>
            <div className={styles.resultHeader}>
              <h2 className={styles.resultTitle}>
                {selected || "All"} Collection
              </h2>
              <span className={styles.count}>{items.length} items</span>
            </div>

            {loading && items.length === 0 ? (
              <div className="loading-spinner" />
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                <span>🔍</span>
                <p>No items found for this selection.</p>
              </div>
            ) : (
              <>
                <div className="grid-3">
                  {items.map((item) => <ArtCard key={item.id} item={item} />)}
                </div>
                {hasMore && (
                  <div className={styles.loadMore}>
                    <button
                      onClick={() => loadItems(false)}
                      className="btn-secondary"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
