"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { uploadMediaFile } from "../../lib/storageService";
import { createArtItem } from "../../lib/dbService";
import { INDIAN_STATES, CATEGORIES, ART_FORMS, COMMUNITIES } from "../../lib/constants";
import styles from "./upload.module.css";

const INITIAL_FORM = {
  title: "", description: "", state: "", district: "",
  category: "", art_form: "", community: "", tags: "",
};

function UploadPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isShort, setIsShort] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const shortIntent = searchParams.get("short") === "1";

  const isVideoFile = Boolean(file?.type?.startsWith("video"));
  const shortDefaults = {
    state: "India",
    category: "Short Video",
    district: "",
    art_form: "",
    community: "",
    tags: ["shorts"],
  };

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  useEffect(() => {
    if (shortIntent) {
      setIsShort(true);
    }
  }, [shortIntent]);

  if (!user) return null;

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getVideoDuration = (selectedFile) => new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(selectedFile);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video metadata."));
    };
  });

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setError("");

    if (selectedFile.type.startsWith("video")) {
      try {
        const duration = await getVideoDuration(selectedFile);
        setVideoDuration(duration || 0);
        if (isShort && duration > 60) {
          setFile(null);
          setPreview(null);
          return setError("Short videos must be 60 seconds or less.");
        }
      } catch {
        setFile(null);
        setPreview(null);
        return setError("Unable to process video. Try another file.");
      }
    } else {
      setIsShort(false);
      setVideoDuration(0);
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview({ url: e.target.result, type: selectedFile.type });
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a media file to upload.");
    if (!form.title && !isShort) {
      return setError("Title is required.");
    }
    if (!isShort && (!form.state || !form.category)) {
      return setError("State and Category are required.");
    }
    if (isShort && !file.type.startsWith("video")) {
      return setError("Shorts can only be created from video uploads.");
    }
    if (isShort && videoDuration > 60) {
      return setError("Short videos must be 60 seconds or less.");
    }

    setUploading(true);
    setError("");
    setProgress(10);

    const { url, mediaType, error: uploadError } = await uploadMediaFile(
      file, user.uid, (p) => setProgress(p)
    );

    if (uploadError) {
      setUploading(false);
      setProgress(0);
      return setError(uploadError);
    }

    setProgress(80);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = isShort
      ? {
          ...form,
          title: form.title?.trim() || `Short by ${user.displayName || "creator"}`,
          description: form.description?.trim() || "Short cultural clip",
          state: shortDefaults.state,
          category: shortDefaults.category,
          district: shortDefaults.district,
          art_form: shortDefaults.art_form,
          community: shortDefaults.community,
          tags: Array.from(new Set([...shortDefaults.tags, ...tags])),
        }
      : {
          ...form,
          title: form.title?.trim(),
          description: form.description?.trim(),
          tags,
        };

    const { error: dbError } = await createArtItem(
      {
        ...payload,
        media_url: url,
        media_type: mediaType,
        tags: payload.tags,
        moderation_status: "pending",
        is_short: isShort && mediaType === "video",
        duration_seconds: mediaType === "video" && Number.isFinite(videoDuration)
          ? Math.round(videoDuration)
          : null,
      },
      user.uid
    );

    setProgress(100);
    setUploading(false);

    if (dbError) return setError(dbError);

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Upload Cultural Content</h1>
          <p className={styles.subtitle}>
            Share traditional folk art, crafts, and performances with the world
          </p>
        </div>

        {success ? (
          <div className={styles.successBox}>
            <span>🎉</span>
            <h3>Upload Submitted!</h3>
            <p>Your content is now pending admin review. Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* ── Left Column ─────────────────────────────── */}
            <div className={styles.left}>
              {/* Drop Zone */}
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${file ? styles.hasFile : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  hidden
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {preview ? (
                  <div className={styles.previewWrap}>
                    {preview.type?.startsWith("video") ? (
                      <video src={preview.url} className={styles.previewMedia} controls />
                    ) : preview.type?.startsWith("audio") ? (
                      <audio src={preview.url} className={styles.audioPreview} controls />
                    ) : (
                      <img src={preview.url} alt="preview" className={styles.previewMedia} />
                    )}
                    <p className={styles.changeFile}>Click to change file</p>
                  </div>
                ) : (
                  <div className={styles.dropPrompt}>
                    <span className={styles.dropIcon}>📁</span>
                    <p className={styles.dropText}>Drag & drop or click to upload</p>
                    <p className={styles.dropHint}>Images (JPG, PNG, WebP) · Videos (MP4, WebM) · Audio (MP3, WAV, OGG)</p>
                    <p className={styles.dropHint}>Max: 10MB image · 100MB video · 20MB audio</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}%</span>
                </div>
              )}
            </div>

            {/* ── Right Column ────────────────────────────── */}
            <div className={styles.right}>
              <div className={styles.field}>
                <label>
                  {isShort ? "Caption" : "Title"} {!isShort && <span className={styles.req}>*</span>}
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handle}
                  placeholder={isShort ? "Add a short caption (optional)" : "e.g. Madhubani Fish Painting"}
                  required={!isShort}
                />
              </div>

              <div className={styles.field}>
                <label>{isShort ? "Description (optional)" : "Description"}</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handle}
                  rows={isShort ? 2 : 3}
                  placeholder={
                    isShort
                      ? "Say something about this short (optional)"
                      : "Describe the art, its significance, history..."
                  }
                />
              </div>

              {isShort ? (
                <div className={styles.shortHint}>
                  Quick Shorts mode is on. Extra metadata will be auto-filled to keep upload simple.
                </div>
              ) : (
                <>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>State <span className={styles.req}>*</span></label>
                      <select name="state" value={form.state} onChange={handle} required>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>District</label>
                      <input name="district" value={form.district} onChange={handle} placeholder="e.g. Darbhanga" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Category <span className={styles.req}>*</span></label>
                      <select name="category" value={form.category} onChange={handle} required>
                        <option value="">Select Category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>Art Form</label>
                      <select name="art_form" value={form.art_form} onChange={handle}>
                        <option value="">Select Art Form</option>
                        {ART_FORMS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Community / Tribe</label>
                    <select name="community" value={form.community} onChange={handle}>
                      <option value="">Select Community</option>
                      {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>Tags</label>
                    <input
                      name="tags"
                      value={form.tags}
                      onChange={handle}
                      placeholder="e.g. madhubani, bihar, painting (comma separated)"
                    />
                    <span className={styles.hint}>Separate tags with commas</span>
                  </div>
                </>
              )}

              {error && <p className="error-msg">{error}</p>}

              {isVideoFile && (
                <div className={styles.shortOption}>
                  <label className={styles.shortToggle}>
                    <input
                      type="checkbox"
                      checked={isShort}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked && videoDuration > 60) {
                          setError("Short videos must be 60 seconds or less.");
                          return;
                        }
                        setIsShort(checked);
                        setError("");
                      }}
                    />
                    <span>Publish as Short Video</span>
                  </label>
                  <p className={styles.shortHint}>
                    Shorts are quick video posts up to 60 seconds.
                    {videoDuration ? ` Current length: ${Math.round(videoDuration)}s.` : ""}
                  </p>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={uploading}>
                {uploading ? `Uploading... ${progress}%` : "Upload Content 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="loading-spinner" style={{ marginTop: 80 }} />}>
      <UploadPageContent />
    </Suspense>
  );
}
