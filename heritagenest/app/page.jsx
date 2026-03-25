"use client";
import { useState, useEffect, useCallback } from "react";
import ArtCard from "../components/ArtCard";
import { fetchArtItems, fetchFilteredItems, searchArtItems } from "../lib/dbService";
import { INDIAN_STATES, CATEGORIES, ART_FORMS } from "../lib/constants";
import styles from "./page.module.css";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({ state: "", art_form: "", category: "" });

  const loadItems = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const cursor = reset ? null : lastDoc;
    const hasFilters = filters.state || filters.art_form || filters.category;
    const result = hasFilters
      ? await fetchFilteredItems(filters, cursor)
      : await fetchArtItems(cursor);

    if (reset) {
      setItems(result.items);
    } else {
      setItems((prev) => [...prev, ...result.items]);
    }
    setLastDoc(result.lastVisible);
    setHasMore(result.items.length === 12);
    setLoading(false);
    setLoadingMore(false);
  }, [filters, lastDoc]);

  useEffect(() => {
    loadItems(true);
  }, [filters]);

  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const result = await searchArtItems(term);
      const uniqueTitles = Array.from(
        new Set((result.items || []).map((item) => item.title).filter(Boolean))
      ).slice(0, 6);
      setSuggestions(uniqueTitles);
      setShowSuggestions(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return loadItems(true);
    setShowSuggestions(false);
    setSearching(true);
    setLoading(true);
    const result = await searchArtItems(search.trim());
    setItems(result.items);
    setHasMore(false);
    setLoading(false);
    setSearching(false);
  };

  const clearSearch = () => {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    loadItems(true);
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    setSearching(true);
    setLoading(true);
    const result = await searchArtItems(suggestion);
    setItems(result.items);
    setHasMore(false);
    setLoading(false);
    setSearching(false);
  };

  const suggestionChips = ["Madhubani", "Warli", "Folk Music", "Dance", "Tribal Art", "Short Video"];

  const handleFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setLastDoc(null);
  };

  const clearFilters = () => {
    setFilters({ state: "", art_form: "", category: "" });
    setLastDoc(null);
  };

  const handleItemUpdate = () => {
    console.log("🔄 Item updated, refreshing list...");
    loadItems(true);
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🏛 Digital Cultural Archive</span>
          <h1 className={styles.heroTitle}>
            Preserving India's<br />Cultural Heritage Digitally
          </h1>
          <p className={styles.heroSub}>
            Explore traditional folk art, heritage sites, crafts, and performances from across India.
          </p>
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search folk art, dance forms, crafts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setShowSuggestions(true)}
            />
            {search && (
              <button type="button" onClick={clearSearch} className={styles.clearBtn}>✕</button>
            )}
            <button type="submit" className={styles.searchBtn}>Search</button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionBox}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className={styles.suggestionChips}>
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={styles.chipBtn}
                onClick={() => handleSuggestionClick(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────── */}
      <section className={styles.filterBar}>
        <div className="container">
          <div className={styles.filterInner}>
            <select value={filters.state} onChange={(e) => handleFilter("state", e.target.value)}>
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => handleFilter("category", e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.art_form} onChange={(e) => handleFilter("art_form", e.target.value)}>
              <option value="">All Art Forms</option>
              {ART_FORMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            {(filters.state || filters.category || filters.art_form) && (
              <button onClick={clearFilters} className={styles.clearFilters}>Clear Filters ✕</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────── */}
      <section className={styles.gallery}>
        <div className="container">
          <div className={styles.galleryHeader}>
            <h2 className="section-title">
              {search ? `Results for "${search}"` : "Explore Folk Arts"}
            </h2>
            <p className="section-subtitle">
              {searching ? "Searching..." : `${items.length} item${items.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {loading ? (
            <div className="loading-spinner" />
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <span>🔍</span>
              <p>No items found. Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid-3">
              {items.map((item) => (
                <ArtCard key={item.id} item={item} onUpdate={handleItemUpdate} />
              ))}
            </div>
          )}

          {hasMore && !loading && !search && (
            <div className={styles.loadMore}>
              <button
                onClick={() => loadItems(false)}
                className="btn-secondary"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
