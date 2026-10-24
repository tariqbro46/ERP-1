# Implementation Plan: App Versioning & Release Notes Automation Engine

## 1. Problem Analysis & Core Cause
When you click **"Push changes to GitHub"** in the Google AI Studio sidebar:
- It runs a Git synchronization tool that commits and pushes whatever code already exists in your local repository to GitHub (`main` branch), which Vercel then deploys.
- It **does not** automatically create code or write release notes on its own.
- **Why Release Notes & Version didn't update previously:** The version number and release notes data live inside your application's source files (`src/data/releaseNotes.ts`, `server.ts`, and `package.json`). If the files were not updated with the new version and changelog **before** clicking "Push changes to GitHub", the pushed commit contains the old version and notes.

---

## 2. Proposed Architecture & Solution
To fulfill your exact request, we will establish a **Unified Dual Release Management System**:

### System 1: In-App Interactive Release Manager (UI Console)
- Add a dedicated **"Publish New Release & Version Manager"** modal and tab inside **Settings > GitHub & Release (`/settings?tab=github`)** and from the **Release Notes (`/release-notes`)** page.
- **Custom Version Input:** Allows entering any semantic version (e.g., `1.1.11`, `1.1.2`, `1.2.0`, `2.0.0`).
- **Changelog Builder:**
  - Release Title & Summary (in English & Bangla)
  - Interactive item entries for **New Features (নতুন ফিচার)**, **Improvements (উন্নয়ন)**, and **Bug Fixes (বাগ ফিক্স)**.
- **One-Click Publish:**
  - Persists the new release into Firestore (`system/release_notes` & `system/config`).
  - Calls backend synchronization route (`/api/github/release`) to update `src/data/releaseNotes.ts`, `server.ts`, and `package.json`.
  - Immediately broadcasts the new version across the frontend.

### System 2: Chat-Driven Release Management
- When working in chat, you can simply tell the Assistant:
  > *"I want to publish version 1.2.0 with the ledger fixes and bank account enhancements."*
- The Assistant will immediately write the structured changelog entry into `src/data/releaseNotes.ts`, update `LATEST_VERSION` to `v1.2.0`, and update `package.json`.
- All you do next is click **"Push changes to GitHub"** in the AI Studio panel — and your GitHub and Vercel live app will instantly showcase the new version!

---

## 3. Reflection Across the Entire System
The newly published version will be dynamically reflected everywhere you requested:
1. **Header / Navbar:** The top-left/top-right brand badge displays the active version badge (`v1.2.0` or user-defined version) with an instant link to Release Notes.
2. **Settings:** Settings header, System Info, and the GitHub & Release tab show the current version and release history.
3. **Release Notes Page (`/release-notes`):** Automatically selects and renders the newly created version as `isLatest: true`, with categorized tabs (All, New Features, Improvements, Bug Fixes) and bilingual support (Bangla & English).
4. **What's New Modal (`WhatsNewModal.tsx`):** Automatically compares `LAST_SEEN_VERSION_KEY` with the new version and presents a celebration popup highlighting what's new.

---

## 4. Proposed Changes

### Backend & Data Services
- **`server.ts`**:
  - Add `/api/github/release` endpoint that programmatically updates `src/data/releaseNotes.ts`, updates `package.json` version, commits changes with a standardized release tag (`git commit` + `git tag`), and returns updated metadata.
- **`src/services/erpService.ts`**:
  - Add `publishReleaseNote(releaseData)` and `getLiveReleaseNotes()` to sync release records with Firestore for multi-device visibility.

### Frontend UI Components
- **`src/components/ReleaseManagerModal.tsx` (New Component)**:
  - Intuitive modal for authoring releases: version input, title, summary, dynamic list of New Features, Improvements, and Bug Fixes, with live preview.
- **`src/components/Settings.tsx`**:
  - Upgrade the **GitHub & Release** tab with a "Publish New Release" trigger button and live version switcher.
- **`src/components/ReleaseNotes.tsx`**:
  - Add an admin/founder **"Create Release"** button that opens `ReleaseManagerModal`.
- **Top Header (`src/App.tsx` or Header components)**:
  - Ensure the version badge reflects the live active version dynamically.
- **`src/components/WhatsNewModal.tsx`**:
  - Ensure it reads from the active live release notes data.

---

## 5. Verification Plan
1. **Build & Lint Verification:** Run `compile_applet` and `lint_applet` to guarantee 0 build or TypeScript errors.
2. **Version Publishing Test:** Test creating and publishing a sample version (e.g. `1.1.2` or `1.2.0`) via the Release Manager.
3. **Multi-location Check:**
   - Verify version badge in Header.
   - Verify version in Settings.
   - Verify version in `/release-notes`.
   - Verify What's New modal opens for unread version.
4. **Git Sync Readiness:** Confirm that files are staged and ready for clean one-click pushing via the AI Studio GitHub panel.
