"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createArtItem } from "@/lib/dbService";
import Link from "next/link";
import styles from "./itemForm.module.css";

export default function NewItemForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    art_form: "",
    state: "",
    district: "",
    community: "",
    media_url: "",
    media_type: "image",
    tags: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { id, error: createError } = await createArtItem(
        {
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
        },
        user.uid
      );

      if (createError) {
        setError(createError);
      } else {
        router.push("/admin/items");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Add New Art Item</h2>
        <Link href="/admin/items" className={styles.backBtn}>
          ← Back to Items
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Traditional Kathak Dance"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Detailed description of the art form..."
            rows="5"
          />
        </div>

        <div className={styles.twoColumn}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Dance">Dance</option>
              <option value="Music">Music</option>
              <option value="Craft">Craft</option>
              <option value="Festival">Festival</option>
              <option value="Cuisine">Cuisine</option>
              <option value="Architecture">Architecture</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="art_form">Art Form *</label>
            <input
              type="text"
              id="art_form"
              name="art_form"
              value={formData.art_form}
              onChange={handleChange}
              required
              placeholder="e.g., Kathak, Odissi"
            />
          </div>
        </div>

        <div className={styles.twoColumn}>
          <div className={styles.formGroup}>
            <label htmlFor="state">State *</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="e.g., Uttar Pradesh"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="district">District</label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="e.g., Lucknow"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="community">Community</label>
          <input
            type="text"
            id="community"
            name="community"
            value={formData.community}
            onChange={handleChange}
            placeholder="Associated community"
          />
        </div>

        <div className={styles.twoColumn}>
          <div className={styles.formGroup}>
            <label htmlFor="media_url">Media URL (Image/Video) *</label>
            <input
              type="url"
              id="media_url"
              name="media_url"
              value={formData.media_url}
              onChange={handleChange}
              required
              placeholder="https://..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="media_type">Media Type *</label>
            <select
              id="media_type"
              name="media_type"
              value={formData.media_type}
              onChange={handleChange}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., traditional, classical, dance"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating..." : "Create Item"}
          </button>
          <Link href="/admin/items" className={styles.cancelBtn}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
