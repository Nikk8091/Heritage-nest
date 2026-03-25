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
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const ITEMS_PER_PAGE = 12;
const PUBLIC_STATUSES = ["approved", undefined, null, ""];

function isPubliclyVisible(item) {
  return PUBLIC_STATUSES.includes(item?.moderation_status);
}

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
      is_short: data.media_type === "video" ? Boolean(data.is_short) : false,
      duration_seconds: data.duration_seconds || null,
      moderation_status: data.moderation_status || "pending",
      reviewed_at: null,
      reviewed_by: null,
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
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(isPubliclyVisible);
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

export async function fetchAdminArtItems(lastDoc = null) {
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
      .filter(isPubliclyVisible)
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
      .filter(isPubliclyVisible)
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
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(isPubliclyVisible);
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
      snapshot.docs.forEach((d) => {
        const item = { id: d.id, ...d.data() };
        if (isPubliclyVisible(item)) allItems.push(item);
      });
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
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(isPubliclyVisible);
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}

// ─── SHORTS ──────────────────────────────────────────────────────────────────

export async function fetchShortVideos() {
  try {
    const directQuery = query(
      collection(db, "artItems"),
      where("media_type", "==", "video"),
      where("is_short", "==", true),
      orderBy("created_at", "desc"),
      limit(24)
    );

    const directSnapshot = await getDocs(directQuery);
    const directItems = directSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((item) => item?.moderation_status !== "rejected");
    return { items: directItems, error: null };
  } catch (error) {
    try {
      const fallbackQuery = query(
        collection(db, "artItems"),
        orderBy("created_at", "desc"),
        limit(80)
      );

      const snapshot = await getDocs(fallbackQuery);
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((item) => item?.moderation_status !== "rejected")
        .filter((item) => item.media_type === "video" && item.is_short === true)
        .slice(0, 24);

      return { items, error: null };
    } catch (fallbackError) {
      return { items: [], error: fallbackError.message || error.message };
    }
  }
}

export async function fetchPendingModerationItems() {
  try {
    const q = query(
      collection(db, "artItems"),
      orderBy("created_at", "desc"),
      limit(120)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((item) => item.moderation_status === "pending");
    return { items, error: null };
  } catch (error) {
    return { items: [], error: error.message };
  }
}

export async function updateModerationStatus(itemId, status, adminId) {
  try {
    const itemRef = doc(db, "artItems", itemId);
    await updateDoc(itemRef, {
      moderation_status: status,
      reviewed_by: adminId,
      reviewed_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// ─── ADMIN INSIGHTS ──────────────────────────────────────────────────────────

export async function fetchAdminInsights() {
  try {
    const q = query(collection(db, "artItems"), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const mediaBreakdown = items.reduce(
      (acc, item) => {
        const mediaType = item.media_type || "unknown";
        if (!acc[mediaType]) acc[mediaType] = 0;
        acc[mediaType] += 1;
        if (item.is_short === true) acc.shorts += 1;
        return acc;
      },
      { image: 0, video: 0, audio: 0, unknown: 0, shorts: 0 }
    );

    const topStatesMap = items.reduce((acc, item) => {
      const key = item.state || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topStates = Object.entries(topStatesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => ({ state, count }));

    const moderationBreakdown = items.reduce(
      (acc, item) => {
        const status = item.moderation_status || "approved";
        if (!acc[status]) acc[status] = 0;
        acc[status] += 1;
        return acc;
      },
      { approved: 0, pending: 0, rejected: 0 }
    );

    const latestItem = items[0] || null;

    return {
      insights: {
        totalItems: items.length,
        mediaBreakdown,
        moderationBreakdown,
        topStates,
        latestItemDate: latestItem?.created_at || null,
      },
      error: null,
    };
  } catch (error) {
    return {
      insights: {
        totalItems: 0,
        mediaBreakdown: { image: 0, video: 0, audio: 0, unknown: 0, shorts: 0 },
        moderationBreakdown: { approved: 0, pending: 0, rejected: 0 },
        topStates: [],
        latestItemDate: null,
      },
      error: error.message,
    };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateArtItem(id, data) {
  try {
    const itemRef = doc(db, "artItems", id);
    await updateDoc(itemRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteArtItem(id) {
  try {
    await deleteDoc(doc(db, "artItems", id));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}
