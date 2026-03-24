"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { uploadMediaFile } from "../../lib/storageService";
import { createArtItem } from "../../lib/dbService";
import { INDIAN_STATES, CATEGORIES, ART_FORMS, COMMUNITIES } from "../../lib/constants";
import styles from "./upload.module.css";

const INITIAL_FORM = {
  title: "", description: "", state: "", district: "",
  category: "", art_form: "", community: "", tags: "",
};

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError("");
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
    if (!form.title || !form.state || !form.category) {
      return setError("Title, State, and Category are required.");
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

    const { error: dbError } = await createArtItem(
      { ...form, media_url: url, media_type: mediaType, tags },
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
            <h3>Uploaded Successfully!</h3>
            <p>Redirecting to your dashboard...</p>
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
                  accept="image/*,video/*"
                  hidden
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {preview ? (
                  <div className={styles.previewWrap}>
                    {preview.type?.startsWith("video") ? (
                      <video src={preview.url} className={styles.previewMedia} controls />
                    ) : (
                      <img src={preview.url} alt="preview" className={styles.previewMedia} />
                    )}
                    <p className={styles.changeFile}>Click to change file</p>
                  </div>
                ) : (
                  <div className={styles.dropPrompt}>
                    <span className={styles.dropIcon}>📁</span>
                    <p className={styles.dropText}>Drag & drop or click to upload</p>
                    <p className={styles.dropHint}>Images (JPG, PNG, WebP) · Videos (MP4, WebM)</p>
                    <p className={styles.dropHint}>Max: 10MB image · 100MB video</p>
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
                <label>Title <span className={styles.req}>*</span></label>
                <input name="title" value={form.title} onChange={handle} placeholder="e.g. Madhubani Fish Painting" required />
              </div>

              <div className={styles.field}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Describe the art, its significance, history..." />
              </div>

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

              {error && <p className="error-msg">{error}</p>}

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
