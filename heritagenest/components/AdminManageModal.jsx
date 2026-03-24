"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateArtItem, deleteArtItem } from "@/lib/dbService";
import { uploadMediaFile } from "@/lib/storageService";
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item.media_url || "");
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
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

      // Upload new image if selected
      if (imageFile) {
        console.log("📤 Uploading image...");
        const { url, mediaType: type, error: uploadError } = await uploadMediaFile(
          imageFile,
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
        console.log("✅ Image uploaded:", mediaUrl);
      }

      // Update item in database
      const updateData = {
        ...formData,
        media_url: mediaUrl,
        media_type: mediaType,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
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
          {/* Image Upload */}
          <div className={styles.imageSection}>
            <div className={styles.imagePreview}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <div className={styles.placeholder}>No image</div>
              )}
            </div>
            <label className={styles.uploadLabel}>
              📤 Upload New Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
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
                <option value="Dance">Dance</option>
                <option value="Music">Music</option>
                <option value="Craft">Craft</option>
                <option value="Festival">Festival</option>
                <option value="Cuisine">Cuisine</option>
                <option value="Architecture">Architecture</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Art Form</label>
              <input
                type="text"
                name="art_form"
                value={formData.art_form}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.formGroup}>
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={loading}
              />
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
            <input
              type="text"
              name="community"
              value={formData.community}
              onChange={handleChange}
              disabled={loading}
            />
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
