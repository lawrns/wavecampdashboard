# Heiwa House CMS - Complete User Guide

**Admin Dashboard URL:** https://heiwahouse.netlify.app/admin

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Rooms](#managing-rooms)
3. [Managing Surf Camps](#managing-surf-camps)
4. [Managing Add-ons](#managing-add-ons)
5. [Managing Pages & Content](#managing-pages--content)
6. [Managing Bookings](#managing-bookings)
7. [Database Structure](#database-structure)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the CMS

1. Navigate to **https://heiwahouse.netlify.app/admin**
2. Log in with your admin credentials (Supabase authentication)
3. You'll see the main admin dashboard with navigation to all sections

### Understanding the Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Database                    │
│  (Single source of truth for all data)                 │
└─────────────────┬──────────────────────┬────────────────┘
                  │                      │
                  │                      │
          ┌───────▼──────────┐  ┌────────▼────────────┐
          │  Admin Dashboard │  │  Customer Website   │
          │  (heiwahouse.    │  │  (heiwa-house-      │
          │   netlify.app)   │  │   portugal.         │
          │                  │  │   netlify.app)      │
          │ • Rooms          │  │                     │
          │ • Surf Camps     │  │ • Booking Widget    │
          │ • Add-ons        │  │ • Rooms Display     │
          │ • Pages/Content  │  │ • Surf Weeks        │
          │ • Bookings       │  │ • Add-ons Selection │
          └──────────────────┘  └─────────────────────┘
```

**Key Point:** When you create/edit anything in the CMS, it's immediately available on the customer website because both applications read from the same Supabase database.

---

## Managing Rooms

**Location:** `/admin/rooms`

### Creating a New Room

1. Click **"Add New Room"** button
2. Fill in the required fields:

   **Basic Information:**
   - **Room Name:** e.g., "Ocean View Suite"
   - **Capacity:** Number of guests (e.g., 2)
   - **Booking Type:**
     - **Whole Room:** Customers book the entire room
     - **Per Bed:** Customers book individual beds (for dorms)

   **Pricing:**
   - **Standard Price:** Regular season price (€)
   - **Off-Season Price:** Lower season price (€)

   **Description:**
   - Detailed description of the room features

   **Images:**
   - Click upload area to add room photos
   - Supports JPG/PNG, max 5MB per image
   - Add multiple images (recommended: 3-5 images)
   - Images are automatically stored in Supabase Storage

   **Amenities:**
   Select all that apply:
   - Private/Shared Bathroom
   - Wooden Furniture
   - Traditional Tiles
   - Bed Types (Queen, Twin, Bunk)
   - WiFi, Air Conditioning, Sea View, Balcony, Kitchen, etc.

   **Bed Types:**
   - Single
   - Double
   - Bunk

   **Status:**
   - ☑ **Active:** Room is visible and bookable on website
   - ☐ **Inactive:** Room is hidden from website

3. Click **"Create Room"**

### Editing a Room

1. Find the room in the grid
2. Click the **Edit** (pencil) icon
3. Update any fields
4. Click **"Update Room"**

### Deleting a Room

1. Click the **Trash** icon on the room card
2. Confirm deletion
3. ⚠️ **Warning:** This permanently removes the room. Ensure no active bookings exist for this room.

### Example: Creating a Dorm Room

```
Room Name: Shared Dorm - 6 Beds
Capacity: 6
Booking Type: Per Bed
Standard Price: 30€
Off-Season Price: 25€
Description: Shared dormitory room with 6 comfortable beds, perfect for solo travelers and groups looking for an affordable stay.
Amenities: [Shared Bathroom, Bunk Beds, WiFi, Community Space]
Bed Types: [Bunk]
Active: ☑
```

---

## Managing Surf Camps

**Location:** `/admin/surfcamps`

### Creating a New Surf Camp

1. Click **"Create New Camp"**
2. Fill in the required fields:

   **Basic Information:**
   - **Category:**
     - **Frenchman's (FR):** Premium surf camp at Frenchman's Cove
     - **Honolua Bay (HH):** Standard surf camp at Honolua Bay
   - **Name:** Auto-generated or custom (e.g., "Frenchman's Surf Camp - June 2025")
   - **Max Occupancy:** Maximum number of participants (e.g., 12)

   **Dates:**
   - **Start Date:** Camp start date
   - **End Date:** Automatically set to 7 days after start (editable)
   - ⚠️ **Note:** System prevents overlapping camps of the same category

   **Available Rooms:**
   - Select which rooms can be booked during this camp
   - Must select at least one room

   **Dietary Information:**
   - **Dietary Preferences:** vegetarian, vegan, gluten-free (comma-separated)
   - **Allergies:** peanuts, shellfish, dairy (comma-separated)

   **Additional Details (Advanced):**
   - **Description:** Camp overview and what's included
   - **Price:** Base camp price (€)
   - **Skill Level:** beginner, intermediate, advanced, all
   - **Includes:** Array of what's included (e.g., "Daily surf lessons", "Equipment rental", "Breakfast")
   - **Images:** Camp photos

3. Click **"Create Camp"**

### Managing Camp Assignments

1. Click **"View Details"** on any camp card
2. You'll see three columns:
   - **Available Clients:** All clients not yet assigned
   - **Available Rooms:** All rooms not yet assigned
   - **Assigned to Camp:** Current assignments

3. **To assign clients/rooms:**
   - Drag clients from "Available Clients" to "Assigned to Camp"
   - Drag rooms from "Available Rooms" to "Assigned to Camp"

4. **To remove assignments:**
   - Click the trash icon next to the assigned item

5. Click **"Save Assignments"**

### Editing a Surf Camp

1. Click the **Edit** icon on camp card
2. Update fields (dates, participants, rooms, etc.)
3. Click **"Update Surf Camp"**

### Example: Creating a Week-Long Camp

```
Category: Frenchman's (FR)
Start Date: 2025-06-15
End Date: 2025-06-22 (auto-filled)
Max Occupancy: 12
Available Rooms: [Ocean View Suite, Twin Room, Dorm Room]
Dietary Preferences: vegetarian, vegan
Allergies: shellfish, peanuts
```

---

## Managing Add-ons

**Location:** `/admin/addons`

**Important:** Add-ons you create here are **automatically available** in the booking widget on the customer website!

### Creating a New Add-on

1. Click **"Add New Service"**
2. Fill in the required fields:

   **Basic Information:**
   - **Add-on Name:** e.g., "Surfboard Rental"
   - **Category:**
     - **Equipment:** Surfboards, wetsuits, gear
     - **Service:** Massage, lessons, coaching
     - **Food & Beverage:** Meals, snacks, drinks
     - **Transportation:** Airport transfer, shuttle
     - **Other:** Miscellaneous items

   **Pricing:**
   - **Price (€):** Per-item or per-service price
   - **Max Quantity (Optional):** Limit stock (e.g., only 20 surfboards available)

   **Description:**
   - Detailed description shown to customers

   **Images:**
   - Upload product/service images
   - Click upload area or drag & drop
   - Max 5MB per image

   **Status:**
   - ☑ **Active:** Visible in booking widget
   - ☐ **Inactive:** Hidden from booking widget

3. Click **"Create Add-on"**

### Editing an Add-on

1. Click the **Edit** icon on add-on card
2. Update fields (price, description, images, etc.)
3. Click **"Update Add-on"**

### Example Add-ons

```
Name: Surfboard Rental
Category: Equipment
Price: 25€
Max Quantity: 20
Description: High-quality surfboards for all skill levels
Active: ☑

Name: Airport Transfer
Category: Transport
Price: 45€
Max Quantity: 10
Description: Convenient transportation to/from airport
Active: ☑

Name: Massage Therapy
Category: Service
Price: 80€
Max Quantity: 5
Description: Relaxing massage after surf sessions
Active: ☑
```

### How Add-ons Appear in Booking Widget

When a customer books a room or surf camp:
1. They see the "Add-ons & Extras" step
2. All **active** add-ons are displayed by category
3. Customer can select quantity for each add-on
4. Total is automatically calculated
5. Add-ons are included in the final booking

---

## Managing Pages & Content

**Location:** `/admin/pages`

### Understanding Pages

Pages are stored as **JSON objects** in the database. Each page has:
- **Slug:** URL identifier (e.g., `home` → `/home`)
- **Title:** Page title for SEO
- **Content:** JSON structure defining page sections
- **Published:** Whether the page is live

### Editing the Homepage

1. Find the "home" page in the list
2. Click **Edit**
3. You'll see two tabs:
   - **Visual Editor:** User-friendly interface for home page
   - **JSON Editor:** Raw JSON for advanced users

#### Using the Visual Editor (Home Page Only)

**Hero Section:**
- **Subtitle:** Small text above title (e.g., "A WAVE AWAY")
- **Title:** Main headline (e.g., "Nestled on Portugal's coast...")
- **Background Image URL:** Hero image path

**Feature Cards:**
- Click **"Add Feature Card"** to create new cards
- Fill in:
  - **Card Title:** e.g., "Heiwa Play"
  - **Image URL:** Card image path
  - **Link URL:** Where card links to (e.g., `/the-spot#play`)
- Click **"Remove"** to delete a card

4. Click **"Update Page"** to save

#### Using the JSON Editor

For advanced customization or non-home pages:

```json
{
  "hero": {
    "title": "Welcome to Heiwa House",
    "subtitle": "A WAVE AWAY",
    "backgroundImage": "/images/hero/main.jpg",
    "cta": [
      {
        "label": "EXPLORE ROOMS",
        "href": "/rooms"
      }
    ]
  },
  "featureCards": [
    {
      "title": "Heiwa Play",
      "image": "/images/play.jpg",
      "href": "/the-spot#play"
    },
    {
      "title": "Heiwa Surf",
      "image": "/images/surf.jpg",
      "href": "/surf-weeks"
    }
  ]
}
```

### Creating a New Page

1. Click **"Create New Page"**
2. Fill in:
   - **Page Slug:** URL-friendly name (lowercase, hyphens)
   - **Page Title:** Display title
   - **Published:** Make live immediately?
   - **Page Content (JSON):** Page structure

3. Click **"Create Page"**

### Example: Creating an "About Us" Page

```
Slug: about-us
Title: About Heiwa House - Our Story
Published: ☑
Content:
{
  "sections": [
    {
      "type": "hero",
      "title": "Our Story",
      "description": "Founded in 2020, Heiwa House..."
    },
    {
      "type": "text",
      "content": "We are a family-run surf house..."
    }
  ]
}
```

---

## Managing Bookings

**Location:** `/admin/bookings`

### Viewing All Bookings

1. Navigate to `/admin/bookings`
2. You'll see a list of all customer bookings with:
   - Customer name and email
   - Check-in/check-out dates
   - Room(s) booked
   - Add-ons selected
   - Total price
   - Booking status
   - Payment status

### Updating a Booking

1. Click on a booking to view details
2. Update status, add notes, or modify details
3. Save changes

### Booking Statuses

- **Pending:** Awaiting payment/confirmation
- **Confirmed:** Booking confirmed
- **Checked-in:** Guest has arrived
- **Checked-out:** Guest has departed
- **Cancelled:** Booking cancelled

---

## Database Structure

### Key Tables

**rooms**
```sql
- id (uuid)
- name (text)
- capacity (integer)
- booking_type (text: 'whole' | 'perBed')
- pricing (jsonb: { standard, offSeason, camp })
- description (text)
- images (text[])
- amenities (text[])
- bed_types (text[])
- is_active (boolean)
- created_at, updated_at
```

**surf_camps**
```sql
- id (uuid)
- name (text)
- description (text)
- start_date (date)
- end_date (date)
- max_participants (integer)
- price (numeric)
- level (text: 'beginner' | 'intermediate' | 'advanced' | 'all')
- includes (text[])
- images (text[])
- is_active (boolean)
- category (text: 'Freedom Routes' | 'Heiwa House')
- food_preferences (text[])
- allergies_info (text[])
- created_at, updated_at
```

**add_ons**
```sql
- id (uuid)
- name (text)
- description (text)
- price (numeric)
- category (text: 'equipment' | 'service' | 'food' | 'transport' | 'other')
- images (text[])
- is_active (boolean)
- max_quantity (integer)
- created_at, updated_at
```

**pages**
```sql
- id (uuid)
- slug (text, unique)
- title (text)
- content (jsonb)
- published (boolean)
- created_at, updated_at
```

**bookings**
```sql
- id (uuid)
- client_id (uuid)
- room_ids (uuid[])
- check_in (date)
- check_out (date)
- total_price (numeric)
- status (text)
- add_ons (jsonb[])
- created_at, updated_at
```

---

## Troubleshooting

### Common Issues

**1. Can't see newly created room on website**
- ✅ Check: Is the room marked as **Active**?
- ✅ Check: Does the room have at least one image?
- ✅ Check: Clear browser cache or open in incognito mode

**2. Add-ons not showing in booking widget**
- ✅ Check: Is the add-on marked as **Active**?
- ✅ Check: Database connection is working (check other data loads)
- ✅ Check: Browser console for errors (F12 → Console tab)

**3. Changes not appearing immediately**
- ✅ Wait 2-3 seconds for real-time updates
- ✅ Refresh the page
- ✅ Check Supabase real-time subscription is active

**4. Upload errors**
- ✅ Check: File size < 5MB
- ✅ Check: File format is JPG or PNG
- ✅ Check: Supabase storage bucket exists ("rooms", "add-ons", etc.)

**5. Can't edit homepage content**
- ✅ Use the **Visual Editor** tab for home page
- ✅ Check JSON syntax if using JSON editor
- ✅ Ensure "slug" is exactly "home"

### Getting Help

1. **Check browser console:** F12 → Console tab for errors
2. **Check Supabase logs:** https://supabase.com/dashboard (your project)
3. **Check Netlify logs:**
   - Admin: https://app.netlify.com/sites/heiwahouse/logs
   - Website: https://app.netlify.com/sites/heiwa-house-portugal/logs

---

## Best Practices

### Images
- **Use consistent aspect ratios** for better visual consistency
- **Optimize images** before upload (compress to reduce file size)
- **Use descriptive filenames** for better organization
- **Recommended sizes:**
  - Room images: 1200x800px
  - Hero images: 1920x1080px
  - Feature cards: 600x600px

### Pricing
- **Always set both standard and off-season prices** even if they're the same
- **Use whole euros** for simplicity (avoid €30.5, use €30 or €31)
- **Review pricing quarterly** to stay competitive

### Content
- **Write clear, compelling descriptions** for rooms and add-ons
- **Use action words** in CTAs ("EXPLORE", "BOOK NOW", "DISCOVER")
- **Keep homepage hero text concise** (1-2 sentences max)

### Data Management
- **Archive instead of delete** when possible (mark as inactive)
- **Regular backups** of critical content
- **Test changes** in draft mode before publishing

---

## Quick Reference

### Keyboard Shortcuts
- None currently implemented

### Admin URLs
- Main Dashboard: https://heiwahouse.netlify.app/admin
- Rooms: https://heiwahouse.netlify.app/admin/rooms
- Surf Camps: https://heiwahouse.netlify.app/admin/surfcamps
- Add-ons: https://heiwahouse.netlify.app/admin/addons
- Pages: https://heiwahouse.netlify.app/admin/pages
- Bookings: https://heiwahouse.netlify.app/admin/bookings

### Customer Website
- Homepage: https://heiwa-house-portugal.netlify.app
- Rooms: https://heiwa-house-portugal.netlify.app/rooms
- Surf Weeks: https://heiwa-house-portugal.netlify.app/surf-weeks

---

**Last Updated:** January 2025
**Version:** 1.0
**Support:** Check CLAUDE.md for development guidelines
