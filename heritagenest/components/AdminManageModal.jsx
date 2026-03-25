"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateArtItem, deleteArtItem } from "@/lib/dbService";
import { uploadMediaFile } from "@/lib/storageService";
import { ART_FORMS, CATEGORIES, COMMUNITIES, INDIAN_STATES } from "@/lib/constants";
import styles from "./AdminManageModal.module.css";

export default function AdminManageModal({ item, isOpen, onClose, onUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    art_form: item.art_form || "",
    state: item.state || "",
    district: item.district || "",
    community: item.community || "",
    category: item.category || "",
    tags: item.tags?.join(", ") || "",
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(item.media_url || "");
  const [mediaPreviewType, setMediaPreviewType] = useState(item.media_type || "image");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      title: item.title || "",
      description: item.description || "",
      art_form: item.art_form || "",
      state: item.state || "",
      district: item.district || "",
      community: item.community || "",
      category: item.category || "",
      tags: item.tags?.join(", ") || "",
    });
    setMediaFile(null);
    setMediaPreview(item.media_url || "");
    setMediaPreviewType(item.media_type || "image");
    setError(null);
    setUploadProgress(0);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      if (file.type.startsWith("video")) {
        setMediaPreviewType("video");
      } else if (file.type.startsWith("audio")) {
        setMediaPreviewType("audio");
      } else {
        setMediaPreviewType("image");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let mediaUrl = item.media_url;
      let mediaType = item.media_type;

      // Upload new media if selected
      if (mediaFile) {
        console.log("📤 Uploading media...");
        const { url, mediaType: type, error: uploadError } = await uploadMediaFile(
          mediaFile,
          user.uid,
          setUploadProgress
        );

        if (uploadError) {
          setError(uploadError);
          setLoading(false);
          return;
        }

        mediaUrl = url;
        mediaType = type;
        console.log("✅ Media uploaded:", mediaUrl);
      }

      // Update item in database
      const updateData = {
        ...formData,
        media_url: mediaUrl,
        media_type: mediaType,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      };

      const { error: updateError } = await updateArtItem(item.id, updateData);

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      console.log("✅ Item updated successfully");
      alert("✅ Item updated successfully!");
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await deleteArtItem(item.id);

      if (deleteError) {
        setError(deleteError);
        setLoading(false);
        return;
      }

      console.log("✅ Item deleted successfully");
      alert("✅ Item deleted successfully!");
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2>Edit Art Item</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSave} className={styles.form}>
          {/* Media Upload */}
          <div className={styles.imageSection}>
            <div className={styles.imagePreview}>
              {mediaPreview ? (
                mediaPreviewType === "video" ? (
                  <video src={mediaPreview} className={styles.mediaPreview} controls />
                ) : mediaPreviewType === "audio" ? (
                  <audio src={mediaPreview} className={styles.audioPreview} controls />
                ) : (
                  <img src={mediaPreview} alt="Preview" />
                )
              ) : (
                <div className={styles.placeholder}>No media</div>
              )}
            </div>
            <label className={styles.uploadLabel}>
              📤 Upload New Media
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleMediaChange}
                disabled={loading}
              />
            </label>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}>
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className={styles.formGroup}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Art Form</label>
              <select
                name="art_form"
                value={formData.art_form}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select</option>
                {ART_FORMS.map((artForm) => (
                  <option key={artForm} value={artForm}>{artForm}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.formGroup}>
              <label>State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Community</label>
            <select
              name="community"
              value={formData.community}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select</option>
              {COMMUNITIES.map((community) => (
                <option key={community} value={community}>{community}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="traditional, dance, classical"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={loading}
            >
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "🗑️ Delete Item"}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
