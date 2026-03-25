"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchArtItemById, fetchRelatedItems, toggleBookmark } from "../../../lib/dbService";
import { useAuth } from "../../../context/AuthContext";
import ArtCard from "../../../components/ArtCard";
import styles from "./item.module.css";

const createWelcomeMessage = () => ({
  role: "assistant",
  content:
    "I am HeriNest AI. Ask me anything about this art card and I will explain it for learning.",
  timestamp: Date.now(),
});

const createInitialAiMessages = () => [createWelcomeMessage()];

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userDoc, refreshUserDoc } = useAuth();

  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiMessages, setAiMessages] = useState(createInitialAiMessages);
  const [aiQuestion, setAiQuestion] = useState("");
  const chatMessagesRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const [chatReady, setChatReady] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const [chatSidebarWidth, setChatSidebarWidth] = useState(390);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const quickPrompts = [
    "How was this made?",
    "Why is this culturally important?",
    "What should I know more about this?",
  ];

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

  useEffect(() => {
    if (!id) return;

    setChatReady(false);
    const storageKey = `artifact-chat-${id}`;
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      setAiMessages(createInitialAiMessages());
      setChatReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const sanitized = Array.isArray(parsed)
        ? parsed
            .filter((msg) => msg && (msg.role === "assistant" || msg.role === "user") && typeof msg.content === "string")
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: Number(msg.timestamp) || Date.now(),
            }))
            .slice(-20)
        : [];

      setAiMessages(sanitized.length > 0 ? sanitized : createInitialAiMessages());
    } catch {
      setAiMessages(createInitialAiMessages());
    }

    setChatReady(true);
  }, [id]);

  useEffect(() => {
    if (!id || !chatReady) return;
    const storageKey = `artifact-chat-${id}`;
    window.localStorage.setItem(storageKey, JSON.stringify(aiMessages.slice(-20)));
  }, [id, aiMessages, chatReady]);

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setAiQuestion(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setAiError("Could not capture voice input. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors during cleanup.
      }
    };
  }, []);

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

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || Number.isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadLabel = useMemo(() => {
    if (!item) return "⬇ Download";
    if (item.media_type === "audio") return "⬇ Download Audio";
    if (item.media_type === "video") return "⬇ Download Video";
    return "⬇ Download Image";
  }, [item]);

  const relatedAudio = related.filter((r) => r.media_type === "audio");

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleSendAiQuestion = async (customQuestion) => {
    if (!item) return;
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
          item: {
            title: item.title,
            description: item.description,
            state: item.state,
            district: item.district,
            community: item.community,
            category: item.category,
            art_form: item.art_form,
            tags: item.tags,
            media_type: item.media_type,
          },
          question,
          history: nextHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAiError(data?.error || "Failed to generate explanation.");
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
      setAiError(error.message || "Network error while requesting AI explanation.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (event) => {
      const rightGap = 0;
      const minWidth = 350;
      const maxWidth = 580;
      const nextWidth = window.innerWidth - event.clientX - rightGap;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, nextWidth));
      setChatSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClearChat = () => {
    setAiMessages(createInitialAiMessages());
    setAiError("");
    setAiQuestion("");
  };

  const handleMicToggle = () => {
    if (!speechSupported || !speechRecognitionRef.current) {
      setAiError("Voice input is not supported in this browser.");
      return;
    }

    setAiError("");
    if (isListening) {
      speechRecognitionRef.current.stop();
      return;
    }

    try {
      speechRecognitionRef.current.start();
      setIsListening(true);
    } catch {
      setAiError("Unable to start microphone. Please allow microphone access.");
      setIsListening(false);
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
    <div
      className={`${styles.page} ${chatSidebarOpen ? styles.pageWithChatOpen : ""}`}
      style={{
        "--chat-sidebar-width": `${chatSidebarWidth}px`,
      }}
    >
      <div className={styles.contentWrap}>
      <div className="container">
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>

        <div className={styles.layout}>
          {/* ── Media ──────────────────────────────────── */}
          <div className={styles.mediaCol}>
            <div className={`${styles.mediaWrap} ${item.media_type === "audio" ? styles.audioWrap : ""}`}>
              {item.media_type === "video" ? (
                <video src={item.media_url} controls className={styles.media} />
              ) : item.media_type === "audio" ? (
                <div className={styles.audioExperience}>
                  <div className={styles.audioTitleRow}>
                    <h3>Audio Performance</h3>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                  <audio
                    src={item.media_url}
                    controls
                    className={styles.audioPlayer}
                    onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 0)}
                    onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime || 0)}
                  />
                  <div className={styles.audioProgressTrack}>
                    <div
                      className={styles.audioProgressFill}
                      style={{ width: `${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className={styles.audioMeta}>
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{audioDuration ? `${Math.round(audioDuration)} sec` : "Duration loading..."}</span>
                  </div>
                </div>
              ) : (
                <img src={item.media_url} alt={item.title} className={styles.media} />
              )}
            </div>

            <div className={styles.actions}>
              <button onClick={handleDownload} className="btn-primary">
                {downloadLabel}
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

        {item.media_type === "audio" && relatedAudio.length > 0 && (
          <section className={styles.relatedAudioSection}>
            <h2 className="section-title">More Audio from {item.state}</h2>
            <p className="section-subtitle">Continue listening to regional folk recordings</p>
            <div className="grid-3">
              {relatedAudio.slice(0, 3).map((r) => <ArtCard key={r.id} item={r} />)}
            </div>
          </section>
        )}
      </div>
      </div>

      {chatSidebarOpen ? (
        <aside className={styles.chatSidebar} style={{ width: `${chatSidebarWidth}px` }}>
          <div
            className={styles.sidebarResizeHandle}
            onMouseDown={() => setIsResizingSidebar(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chatbot sidebar"
            title="Drag to resize"
          />
          <div className={styles.aiSection}>
            <div className={styles.aiHeader}>
              <div className={styles.aiHeaderTitleRow}>
                <button
                  type="button"
                  onClick={() => setChatSidebarOpen(false)}
                  className={styles.chatHeaderToggleBtn}
                  aria-label="Collapse HeriNest AI chatbot"
                  title="Collapse chatbot"
                >
                  −
                </button>
                <h3>HeriNest AI Chatbot</h3>
              </div>
              <div className={styles.aiActions}>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className={styles.aiGhostBtn}
                  disabled={aiLoading}
                >
                  Clear Chat
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiQuestion("Give me a short educational summary of this artifact.")}
                  className={styles.aiBtn}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Thinking..." : "Start with Summary"}
                </button>
              </div>
            </div>

            {aiError && <p className={styles.aiError}>{aiError}</p>}

            <div className={styles.chatCard}>
              <div className={styles.chatMessages} ref={chatMessagesRef}>
                <div className={styles.chatGuide}>
                  <p className={styles.chatGuideText}>
                    This chatbot is limited to this art card only. For another artifact, open that card first.
                  </p>
                  <div className={styles.chatGuidePrompts}>
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendAiQuestion(prompt)}
                        className={styles.quickPromptBtn}
                        disabled={aiLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {aiMessages.map((msg, index) => (
                  <div
                    key={`msg-${index}`}
                    className={`${styles.chatMessage} ${
                      msg.role === "user" ? styles.userMessage : styles.assistantMessage
                    }`}
                  >
                    <span className={styles.chatRole}>
                      {msg.role === "user" ? "You" : "HeriNest AI"}
                    </span>
                    <p>{msg.content}</p>
                    <span className={styles.chatTime}>{formatMessageTime(msg.timestamp)}</span>
                  </div>
                ))}
                {aiLoading && <p className={styles.typing}>HeriNest AI is typing...</p>}
              </div>

              <form
                className={styles.chatInputRow}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiQuestion();
                }}
              >
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiQuestion();
                    }
                  }}
                  placeholder="Ask about history, community, style, or meaning of this artifact"
                  disabled={aiLoading}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
                  disabled={aiLoading || !speechSupported}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  title={speechSupported ? "Voice input" : "Voice input not supported"}
                >
                  {isListening ? "⏹" : "🎤"}
                </button>
                <button
                  type="submit"
                  className={styles.sendBtn}
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
          onClick={() => setChatSidebarOpen(true)}
          className={styles.chatDockToggleBtn}
          aria-label="Expand HeriNest AI chatbot"
          title="Open chatbot"
        >
          <span className={styles.chatDockIcon}>+</span>
          <span className={styles.chatDockText}>HeriNest AI</span>
        </button>
      )}
    </div>
  );
}
