# Admin Panel Setup & Usage Guide

## Overview
Your admin panel is now fully functional! You can manage art items (add, edit, delete) through a user-friendly GUI.

## What Was Created

### File Structure
```
app/admin/
├── layout.jsx              # Admin layout with sidebar navigation
├── admin.module.css        # Admin layout styles
├── page.jsx                # Dashboard (stats & quick actions)
├── dashboard.module.css    # Dashboard styles
├── items/
│   ├── page.jsx            # View all items (with delete button)
│   ├── items.module.css    # Items list styles
│   ├── new/
│   │   ├── page.jsx        # Form to create new item
│   │   └── itemForm.module.css # Form styles
│   └── [id]/
│       └── page.jsx        # Edit form for existing items
```

## Setup Steps

### 1. Create an Admin User
Run this in your browser console or use Firebase Admin SDK:

```javascript
import { createAdminUser } from "@/lib/authService";

// Create admin account
const { user, error } = await createAdminUser(
  "admin@example.com",
  "secure_password_here",
  "Admin Name"
);

if (error) {
  console.error("Error:", error);
} else {
  console.log("Admin created successfully!", user);
}
```

Or manually create a user in Firebase Console and update their Firestore document:
1. Go to Firebase Console → Authentication → Create a new user
2. Go to Firestore → users collection → Find the user document
3. Add a field: `isAdmin: true`

### 2. Access the Admin Panel
Once logged in as admin:
- Go to `http://localhost:3000/admin` (or your deployed URL)
- You'll see the admin dashboard with navigation

## Features

### Dashboard (`/admin`)
- View total number of art items
- Quick links to manage items and add new ones

### View Items (`/admin/items`)
**See all art items in a table format:**
- Displays: Title, Category, State, Created Date
- **Edit** button: Click to modify an item
- **Delete** button: Click to remove an item (with confirmation)

### Add New Item (`/admin/items/new`)
**Create a new art item with:**
- Title (required)
- Description (required)
- Category (required)
  - Dance
  - Music
  - Craft
  - Festival
  - Cuisine
  - Architecture
  - Other
- Art Form (required) - e.g., Kathak, Odissi
- State (required)
- District (optional)
- Community (optional)
- Media URL (required) - Link to image or video
- Media Type (required) - Select "Image" or "Video"
- Tags (optional) - Comma-separated values

### Edit Item (`/admin/items/[id]`)
**Modify existing items:**
- Same fields as "Add New Item"
- Pre-filled with current data
- Changes are saved to Firestore

### Delete Item
**Remove items permanently:**
- Click delete button on items list
- Confirm deletion
- Item is removed from database

## Database Requirements

**User Document (Firestore):**
```javascript
{
  uid: "user-id",
  email: "admin@example.com",
  displayName: "Admin Name",
  photoURL: null,
  isAdmin: true,  // ← Important!
  saved: [],
  created_at: Timestamp
}
```

**Art Item Document (Firestore):**
```javascript
{
  title: "Item Title",
  description: "Description...",
  category: "Dance",
  art_form: "Kathak",
  state: "Uttar Pradesh",
  district: "Lucknow",
  community: "Community Name",
  media_url: "https://...",
  media_type: "image",
  tags: ["tag1", "tag2"],
  user_id: "creator-uid",
  created_at: Timestamp,
  updated_at: Timestamp,
  views: 0
}
```

## Key Functions Added

### In `lib/dbService.js`:

**Create Item**
```javascript
const { id, error } = await createArtItem(data, userId);
```

**Update Item**
```javascript
const { error } = await updateArtItem(itemId, updatedData);
```

**Delete Item**
```javascript
const { error } = await deleteArtItem(itemId);
```

**Fetch All Items**
```javascript
const { items, error } = await fetchArtItems();
```

**Fetch Single Item**
```javascript
const { item, error } = await fetchArtItemById(itemId);
```

## Security Notes

- Admin routes are protected by checking `userDoc?.isAdmin`
- Only authenticated admins can access `/admin` pages
- Non-admin users are redirected to login page
- Implement additional Firestore security rules if needed:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artItems/{document=**} {
      // Only admins can delete
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      // Only admins can update
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Next Steps

1. **Deploy to Firebase**: Push the app and set up Firebase authentication
2. **Create Admin Account**: Use the steps above
3. **Test Admin Panel**: Visit `/admin` route
4. **Add Categories Management**: Create similar pages for `/admin/categories`
5. **Add User Management**: Create pages for managing user accounts

## Troubleshooting

**"You don't have permission to access this page"**
- Check that your user document has `isAdmin: true`
- Check that you're logged in with the correct account
- Clear browser cache and login again

**Can't see items in the list**
- Ensure items exist in Firestore under `artItems` collection
- Check browser console for error messages
- Verify Firestore security rules allow reading items

**Form submission fails**
- Check media URL is valid and publicly accessible
- Verify all required fields are filled
- Check browser console for error details
- Ensure Firestore write permissions are enabled

---

Your admin panel is ready to use! Log in and visit `/admin` to get started.
