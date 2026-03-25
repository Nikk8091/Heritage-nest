"use client";
import { useEffect, useState } from "react";
import { fetchAdminArtItems, deleteArtItem } from "@/lib/dbService";
import Link from "next/link";
import styles from "./items.module.css";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { items: fetchedItems, error: fetchError } = await fetchAdminArtItems();
      if (fetchError) {
        setError(fetchError);
      } else {
        setItems(fetchedItems || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await deleteArtItem(id);
      if (error) {
        alert("Error deleting item: " + error);
      } else {
        setItems(items.filter((item) => item.id !== id));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.state?.toLowerCase().includes(term);

    const matchesMedia = mediaFilter === "all" ? true : item.media_type === mediaFilter;
    const moderationStatus = item.moderation_status || "approved";
    const matchesStatus = statusFilter === "all" ? true : moderationStatus === statusFilter;
    return matchesQuery && matchesMedia && matchesStatus;
  });

  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredItems.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const visibleIds = filteredItems.map((item) => item.id);
    setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected item(s)? This cannot be undone.`)) return;

    try {
      setBulkDeleting(true);
      const results = await Promise.all(selectedIds.map((id) => deleteArtItem(id)));
      const failed = results.filter((r) => r.error);

      if (failed.length > 0) {
        alert(`${failed.length} item(s) could not be deleted. Please try again.`);
      }

      const successfulIds = selectedIds.filter((_, idx) => !results[idx].error);
      setItems((prev) => prev.filter((item) => !successfulIds.includes(item.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Art Items</h2>
        <Link href="/admin/items/new" className={styles.addBtn}>
          + Add New Item
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category, or state"
        />
        <select
          className={styles.filterSelect}
          value={mediaFilter}
          onChange={(e) => setMediaFilter(e.target.value)}
        >
          <option value="all">All Media</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className={styles.bulkBar}>
        <label className={styles.selectAllLabel}>
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectAllVisible}
          />
          Select all visible
        </label>
        <button
          className={styles.bulkDeleteBtn}
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0 || bulkDeleting}
        >
          {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <p>No items found. Create one to get started!</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Select</th>
              <th>Title</th>
              <th>Media</th>
              <th>Category</th>
              <th>State</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  />
                </td>
                <td>{item.title}</td>
                <td>
                  <span className={`${styles.mediaBadge} ${styles[item.media_type] || ""}`}>
                    {item.media_type || "unknown"}
                  </span>
                  {item.is_short && <span className={styles.shortTag}>Short</span>}
                </td>
                <td>{item.category}</td>
                <td>{item.state}</td>
                <td>
                  {item.created_at
                    ? new Date(item.created_at.toDate?.()).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[item.moderation_status || "approved"]}`}>
                    {item.moderation_status || "approved"}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link href={`/admin/items/${item.id}`} className={styles.editBtn}>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
