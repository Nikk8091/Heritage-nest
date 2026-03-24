"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchArtItemById, updateArtItem } from "@/lib/dbService";
import Link from "next/link";
import styles from "../new/itemForm.module.css";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    const loadItem = async () => {
      try {
        const { item, error: fetchError } = await fetchArtItemById(params.id);
        if (fetchError) {
          setError(fetchError);
        } else if (item) {
          setFormData({
            title: item.title || "",
            description: item.description || "",
            category: item.category || "",
            art_form: item.art_form || "",
            state: item.state || "",
            district: item.district || "",
            community: item.community || "",
            media_url: item.media_url || "",
            media_type: item.media_type || "image",
            tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadItem();
    }
  }, [params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await updateArtItem(params.id, {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
      });

      if (updateError) {
        setError(updateError);
      } else {
        router.push("/admin/items");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Edit Art Item</h2>
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
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Updating..." : "Update Item"}
          </button>
          <Link href="/admin/items" className={styles.cancelBtn}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
