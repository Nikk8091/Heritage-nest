"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import ArtCard from "../components/ArtCard";
import { fetchArtItems, fetchFilteredItems, searchArtItems } from "../lib/dbService";
import { INDIAN_STATES, CATEGORIES, ART_FORMS } from "../lib/constants";
import styles from "./page.module.css";

const createHomeWelcomeMessage = () => ({
  role: "assistant",
  content:
    "I am HeriNest AI. Ask me about cultural art, crafts, audio traditions, video traditions, and art history from any category.",
  timestamp: Date.now(),
});

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiMessages, setAiMessages] = useState([createHomeWelcomeMessage()]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [chatSidebarWidth, setChatSidebarWidth] = useState(390);
  const [isResizingChatSidebar, setIsResizingChatSidebar] = useState(false);
  const chatMessagesRef = useRef(null);

  const nonAudioItems = (list = []) => list.filter((item) => item?.media_type !== "audio");

  const quickPrompts = [
    "Explain Warli art style in simple words",
    "How are folk songs and oral traditions preserved?",
    "What is the cultural importance of regional dance forms?",
  ];

  const loadItems = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const cursor = reset ? null : lastDoc;
    const hasFilters = filters.state || filters.art_form || filters.category;
    const result = hasFilters
      ? await fetchFilteredItems(filters, cursor)
      : await fetchArtItems(cursor);

    if (reset) {
      setItems(nonAudioItems(result.items));
    } else {
      setItems((prev) => [...prev, ...nonAudioItems(result.items)]);
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
    setItems(nonAudioItems(result.items));
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
    setItems(nonAudioItems(result.items));
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

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClearHomeChat = () => {
    setAiMessages([createHomeWelcomeMessage()]);
    setAiError("");
    setAiQuestion("");
  };

  const handleAskHomeAi = async (customQuestion) => {
    const question = (customQuestion || aiQuestion).trim();
    if (!question) return;

    const userMessage = { role: "user", content: question, timestamp: Date.now() };
    const nextHistory = [...aiMessages, userMessage].slice(-8);

    setAiMessages((prev) => [...prev, userMessage]);
    setAiQuestion("");
    setAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/artifact-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatScope: "home",
          item: {
            title: "HeriNest Cultural Knowledge Base",
            description:
              "General cultural archive knowledge across visual art, music, dance, craft, oral traditions, short video heritage content, and regional history.",
            state: "India",
            district: "",
            community: "",
            category: "All Categories",
            art_form: "Multiple",
            tags: ["culture", "art", "audio", "video", "history"],
            media_type: "mixed",
          },
          question,
          history: nextHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAiError(data?.error || "Failed to generate response.");
      } else {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data?.answer || "I could not generate a response right now.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      setAiError(error.message || "Network error while requesting AI response.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  useEffect(() => {
    if (!isResizingChatSidebar) return;

    const handleMouseMove = (event) => {
      const rightGap = 0;
      const minWidth = 350;
      const maxWidth = 580;
      const nextWidth = window.innerWidth - event.clientX - rightGap;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, nextWidth));
      setChatSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingChatSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingChatSidebar]);

  return (
    <div
      className={`${styles.homePageWrap} ${chatOpen ? styles.homePageWithChatOpen : ""}`}
      style={{
        "--home-chat-sidebar-width": `${chatSidebarWidth}px`,
      }}
    >
      <div className={styles.homeContentWrap}>
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

      {chatOpen ? (
        <aside className={styles.homeChatSidebar} style={{ width: `${chatSidebarWidth}px` }}>
          <div
            className={styles.homeSidebarResizeHandle}
            onMouseDown={() => setIsResizingChatSidebar(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize home chatbot sidebar"
            title="Drag to resize"
          />
          <div className={styles.homeAiSection}>
            <div className={styles.homeAiHeader}>
              <div className={styles.homeAiHeaderTitleRow}>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className={styles.homeChatHeaderToggleBtn}
                  aria-label="Collapse HeriNest AI chatbot"
                  title="Collapse chatbot"
                >
                  −
                </button>
                <h3>HeriNest AI Chatbot</h3>
              </div>
              <div className={styles.homeAiActions}>
                <button
                  type="button"
                  onClick={handleClearHomeChat}
                  className={styles.homeAiGhostBtn}
                  disabled={aiLoading}
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {aiError && <p className={styles.homeAiError}>{aiError}</p>}

            <div className={styles.homeChatCard}>
              <div className={styles.homeChatMessages} ref={chatMessagesRef}>
                <div className={styles.homeChatGuide}>
                  <p className={styles.homeChatGuideText}>
                    Ask about cultural art, audio, video, and history. If asked outside these topics, I will refuse per guidelines.
                  </p>
                  <div className={styles.homeChatGuidePrompts}>
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleAskHomeAi(prompt)}
                        className={styles.homeQuickPromptBtn}
                        disabled={aiLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {aiMessages.map((msg, index) => (
                  <div
                    key={`home-msg-${index}`}
                    className={`${styles.homeChatMessage} ${
                      msg.role === "user" ? styles.homeUserMessage : styles.homeAssistantMessage
                    }`}
                  >
                    <span className={styles.homeChatRole}>
                      {msg.role === "user" ? "You" : "HeriNest AI"}
                    </span>
                    <p>{msg.content}</p>
                    <span className={styles.homeChatTime}>{formatMessageTime(msg.timestamp)}</span>
                  </div>
                ))}
                {aiLoading && <p className={styles.homeTyping}>HeriNest AI is typing...</p>}
              </div>

              <form
                className={styles.homeChatInputRow}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskHomeAi();
                }}
              >
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskHomeAi();
                    }
                  }}
                  placeholder="Ask about cultural art, audio, video, or art history"
                  disabled={aiLoading}
                  rows={2}
                />
                <button
                  type="submit"
                  className={styles.homeSendBtn}
                  disabled={aiLoading || !aiQuestion.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className={styles.homeChatDockToggleBtn}
          aria-label="Expand HeriNest AI chatbot"
          title="Open chatbot"
        >
          <span className={styles.homeChatDockIcon}>+</span>
          <span className={styles.homeChatDockText}>HeriNest AI</span>
        </button>
      )}
    </div>
  );
}
