import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  documentId,
} from "firebase/firestore";
import { db } from "./firebase";

const ITEMS_PER_PAGE = 12;

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createArtItem(data, userId) {
  try {
    const docRef = await addDoc(collection(db, "artItems"), {
      title: data.title,
      description: data.description,
      state: data.state,
      district: data.district || "",
      art_form: data.art_form,
      community: data.community || "",
      category: data.category,
      media_url: data.media_url,
      media_type: data.media_type, // "image" | "video"
      tags: data.tags || [],
      user_id: userId,
      created_at: serverTimestamp(),
      views: 0,
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
}

// ─── FETCH ALL / PAGINATED ────────────────────────────────────────────────────

export async function fetchArtItems(lastDoc = null) {
  try {
    let q = query(
      collection(db, "artItems"),
      orderBy("created_at", "desc"),
      limit(ITEMS_PER_PAGE)
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { items, lastVisible, error: null };
  } catch (error) {
    return { items: [], lastVisible: null, error: error.message };
  }
}

// ─── FETCH SINGLE ─────────────────────────────────────────────────────────────

export async function fetchArtItemById(id) {
  try {
    const docSnap = await getDoc(doc(db, "artItems", id));
    if (!docSnap.exists()) return { item: null, error: "Item not found" };
    return { item: { id: docSnap.id, ...docSnap.data() }, error: null };
  } catch (error) {
    return { item: null, error: error.message };
  }
}

// ─── RELATED ITEMS ────────────────────────────────────────────────────────────

export async function fetchRelatedItems(state, artForm, excludeId) {
  try {
    const q = query(
      collection(db, "artItems"),
      where("state", "==", state),
      orderBy("created_at", "desc"),
      limit(6)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((item) => item.id !== excludeId);
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

export async function searchArtItems(searchTerm) {
  try {
    // Fetch recent items and filter client-side (Firestore doesn't support full-text search)
    const q = query(
      collection(db, "artItems"),
      orderBy("created_at", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (item) =>
          item.title?.toLowerCase().includes(term) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          item.description?.toLowerCase().includes(term)
      );
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}

// ─── FILTER ───────────────────────────────────────────────────────────────────

export async function fetchFilteredItems(filters = {}, lastDoc = null) {
  try {
    const constraints = [orderBy("created_at", "desc"), limit(ITEMS_PER_PAGE)];

    if (filters.state) constraints.unshift(where("state", "==", filters.state));
    if (filters.art_form) constraints.unshift(where("art_form", "==", filters.art_form));
    if (filters.category) constraints.unshift(where("category", "==", filters.category));

    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, "artItems"), ...constraints);
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { items, lastVisible, error: null };
  } catch (error) {
    return { items: [], lastVisible: null, error: error.message };
  }
}

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────

export async function toggleBookmark(userId, itemId, isSaved) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      saved: isSaved ? arrayRemove(itemId) : arrayUnion(itemId),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

export async function fetchBookmarkedItems(savedIds) {
  if (!savedIds || savedIds.length === 0) return { items: [], error: null };
  try {
    // Firestore 'in' query supports up to 10 items at a time
    const chunks = [];
    for (let i = 0; i < savedIds.length; i += 10) {
      chunks.push(savedIds.slice(i, i + 10));
    }
    const allItems = [];
    for (const chunk of chunks) {
      const q = query(collection(db, "artItems"), where(documentId(), "in", chunk));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((d) => allItems.push({ id: d.id, ...d.data() }));
    }
    return { items: allItems, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}

// ─── USER UPLOADS ─────────────────────────────────────────────────────────────

export async function fetchUserUploads(userId) {
  try {
    const q = query(
      collection(db, "artItems"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { items, total: items.length, error: null };
  } catch (error) {
    return { items: [], total: 0, error: error.message };
  }
}

// ─── TRENDING ─────────────────────────────────────────────────────────────────

export async function fetchTrendingItems() {
  try {
    const q = query(
      collection(db, "artItems"),
      orderBy("created_at", "desc"),
      limit(8)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}
