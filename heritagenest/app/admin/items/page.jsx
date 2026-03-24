"use client";
import { useEffect, useState } from "react";
import { fetchArtItems, deleteArtItem } from "@/lib/dbService";
import Link from "next/link";
import styles from "./items.module.css";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { items: fetchedItems, error: fetchError } = await fetchArtItems();
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

      {items.length === 0 ? (
        <p>No items found. Create one to get started!</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>State</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.state}</td>
                <td>
                  {item.created_at
                    ? new Date(item.created_at.toDate?.()).toLocaleDateString()
                    : "N/A"}
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
