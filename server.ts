import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import PDFDocument from "pdfkit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.ts";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { execFileSync } from "child_process";

const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "firebase-applet-config.json"), "utf8"));

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // Fallback for local development if applicationDefault fails
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

// Helper to access custom Firestore database instance
const getFirestoreInstance = () => {
  const app = admin.apps[0] || admin.app();
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
};

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware: Auth (for SQLite - if still used)
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Firebase Admin Auth Middleware
  const authenticateFirebase = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(403).json({ error: "Invalid Firebase Token" });
    }
  };

  interface VerifiedActor {
    uid: string;
    email: string;
    emailVerified: boolean;
    role: string;
    companyId: string;
    status: string;
    isFounder: boolean;
    isCompanyAdmin: boolean;
  }

  class HttpError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  const resolveVerifiedActor = async (req: any): Promise<VerifiedActor> => {
    const uid = typeof req.user?.uid === "string" ? req.user.uid : "";
    if (!uid) {
      throw new HttpError(401, "Unauthorized");
    }

    const tokenEmail = typeof req.user?.email === "string" ? req.user.email.trim().toLowerCase() : "";
    const emailVerified = req.user?.email_verified === true;
    const configuredFounderEmail = (process.env.FOUNDER_EMAIL || "").trim().toLowerCase();
    const hasFounderClaim = req.user?.role === "Founder";
    const matchesConfiguredFounder = emailVerified && Boolean(configuredFounderEmail) && tokenEmail === configuredFounderEmail;

    let userData: Record<string, any> | null = null;
    let firestoreError = false;

    try {
      const userSnap = await getFirestoreInstance().collection("users").doc(uid).get();
      if (userSnap.exists) {
        userData = userSnap.data() || null;
      }
    } catch (err) {
      firestoreError = true;
      console.error("Failed to lookup caller user profile in Firestore:", err);
    }

    if (userData && String(userData.status || "active").toLowerCase() === "disabled") {
      throw new HttpError(403, "Forbidden: account is disabled");
    }

    if (firestoreError && !hasFounderClaim && !matchesConfiguredFounder) {
      throw new HttpError(403, "Forbidden: unable to verify user role");
    }

    const role = userData ? String(userData.role || "") : "";
    const companyId = userData ? String(userData.companyId || userData.company_id || "").trim() : "";
    const status = userData ? String(userData.status || "active").toLowerCase() : "active";

    const isFounder = hasFounderClaim || role === "Founder" || matchesConfiguredFounder;
    const isCompanyAdmin = !isFounder && status !== "disabled" && role === "Admin" && Boolean(companyId);

    return {
      uid,
      email: tokenEmail,
      emailVerified,
      role: isFounder ? "Founder" : role,
      companyId,
      status,
      isFounder,
      isCompanyAdmin,
    };
  };

  const requireFounder = async (req: any, res: any, next: any) => {
    try {
      const actor = await resolveVerifiedActor(req);
      if (!actor.isFounder) {
        return res.status(403).json({ error: "Forbidden: Founder role required" });
      }
      req.actor = actor;
      next();
    } catch (err: any) {
      const status = err instanceof HttpError ? err.statusCode : 403;
      return res.status(status).json({ error: err.message || "Forbidden" });
    }
  };

  const requireFounderOrCompanyAdmin = async (req: any, res: any, next: any) => {
    try {
      const actor = await resolveVerifiedActor(req);
      if (!actor.isFounder && !actor.isCompanyAdmin) {
        return res.status(403).json({ error: "Forbidden: Founder or Company Admin role required" });
      }
      req.actor = actor;
      next();
    } catch (err: any) {
      const status = err instanceof HttpError ? err.statusCode : 403;
      return res.status(status).json({ error: err.message || "Forbidden" });
    }
  };

  const ALLOWED_USER_ROLES = new Set([
    "Founder",
    "Admin",
    "Marketing Manager",
    "Manager",
    "Accountant",
    "Sales",
    "Staff",
    "Viewer",
    "staff",
    "user",
  ]);

  const isValidDocId = (value: unknown): value is string =>
    typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value.trim());

  // API: Firebase User Management - Add User
  app.post("/api/admin/users", authenticateFirebase, requireFounderOrCompanyAdmin, async (req: any, res) => {
    const actor: VerifiedActor = req.actor;
    const { email, password, displayName, role, companyId } = req.body || {};

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanDisplayName = typeof displayName === "string" ? displayName.trim() : "";
    const requestedRole = typeof role === "string" && role.trim() ? role.trim() : "staff";
    const requestedCompanyId = typeof companyId === "string" ? companyId.trim() : "";

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 6 and 128 characters" });
    }
    if (!cleanDisplayName || cleanDisplayName.length > 120) {
      return res.status(400).json({ error: "Valid displayName is required" });
    }
    if (!ALLOWED_USER_ROLES.has(requestedRole)) {
      return res.status(400).json({ error: "Invalid user role" });
    }
    if (requestedRole === "Founder" && !actor.isFounder) {
      return res.status(403).json({ error: "Forbidden: Only a Founder can assign the Founder role" });
    }

    const effectiveCompanyId = actor.isFounder ? requestedCompanyId : actor.companyId;
    if (!actor.isFounder) {
      if (!actor.companyId) {
        return res.status(403).json({ error: "Forbidden: Caller has no company scope" });
      }
      if (requestedCompanyId && requestedCompanyId !== actor.companyId) {
        return res.status(403).json({ error: "Forbidden: Cannot create users for another company" });
      }
    } else if (!effectiveCompanyId && requestedRole !== "Founder") {
      return res.status(400).json({ error: "companyId is required" });
    }

    try {
      // 1. Create User in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password,
        displayName: cleanDisplayName,
      });

      // 2. Create User Profile in Firestore
      await getFirestoreInstance().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: cleanEmail,
        displayName: cleanDisplayName,
        role: requestedRole,
        companyId: effectiveCompanyId,
        status: 'active',
        createdBy: actor.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(201).json({ uid: userRecord.uid });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Firebase User Management - Delete User
  app.delete("/api/admin/users/:uid", authenticateFirebase, requireFounderOrCompanyAdmin, async (req: any, res) => {
    const actor: VerifiedActor = req.actor;
    const uid = typeof req.params?.uid === "string" ? req.params.uid.trim() : "";

    if (!isValidDocId(uid)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (uid === actor.uid) {
      return res.status(403).json({ error: "Forbidden: Cannot delete your own account" });
    }

    try {
      const targetRef = getFirestoreInstance().collection('users').doc(uid);
      const targetSnap = await targetRef.get();
      const targetData = targetSnap.exists ? (targetSnap.data() || {}) : null;

      if (!targetData) {
        if (!actor.isFounder) {
          return res.status(403).json({ error: "Forbidden: Target user outside company scope" });
        }
        const authUser = await admin.auth().getUser(uid).catch(() => null);
        if (authUser?.customClaims?.role === "Founder") {
          return res.status(403).json({ error: "Forbidden: Founder accounts cannot be deleted here" });
        }
      } else {
        if (String(targetData.role || "") === "Founder") {
          return res.status(403).json({ error: "Forbidden: Founder accounts cannot be deleted here" });
        }
        const targetCompanyId = String(targetData.companyId || targetData.company_id || "").trim();
        if (!actor.isFounder && (!targetCompanyId || targetCompanyId !== actor.companyId)) {
          return res.status(403).json({ error: "Forbidden: Cannot delete users from another company" });
        }
      }

      // 1. Delete from Firebase Auth
      await admin.auth().deleteUser(uid);

      // 2. Delete from Firestore
      await targetRef.delete();

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Firebase User Management - Reset Password
  app.post("/api/admin/users/:uid/reset-password", authenticateFirebase, requireFounderOrCompanyAdmin, async (req: any, res) => {
    const actor: VerifiedActor = req.actor;
    const uid = typeof req.params?.uid === "string" ? req.params.uid.trim() : "";
    const { newPassword } = req.body || {};

    if (!isValidDocId(uid)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ error: "newPassword must be between 6 and 128 characters" });
    }

    try {
      const targetSnap = await getFirestoreInstance().collection('users').doc(uid).get();
      const targetData = targetSnap.exists ? (targetSnap.data() || {}) : null;

      if (!targetData) {
        if (!actor.isFounder) {
          return res.status(403).json({ error: "Forbidden: Target user outside company scope" });
        }
      } else {
        if (String(targetData.role || "") === "Founder" && !actor.isFounder) {
          return res.status(403).json({ error: "Forbidden: Cannot reset Founder account password" });
        }
        const targetCompanyId = String(targetData.companyId || targetData.company_id || "").trim();
        if (!actor.isFounder && (!targetCompanyId || targetCompanyId !== actor.companyId)) {
          return res.status(403).json({ error: "Forbidden: Cannot reset password for another company user" });
        }
      }

      await admin.auth().updateUser(uid, {
        password: newPassword,
      });
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Auth - Register (SQLite - Left for compatibility)
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      stmt.run(username, hashedPassword);
      res.status(201).json({ message: "User created" });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // API: Auth - Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // API: Auth - Me
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // API: Users - List
  app.get("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const users = db.prepare("SELECT id, username, role, created_at FROM users").all();
    res.json(users);
  });

  // API: Users - Update Role
  app.patch("/api/users/:id/role", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Missing role" });

    try {
      const stmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
      stmt.run(role, id);
      res.json({ message: "Role updated" });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API: Generate Invoice PDF (Server-Side)
  app.post("/api/reports/invoice", (req, res) => {
    const { voucherNo, date, partyName, items, totalAmount, vatNo } = req.body;

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${voucherNo}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text("TAX INVOICE", { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10).text(`Voucher No: ${voucherNo}`);
    doc.text(`Date: ${date}`);
    doc.text(`VAT Reg No: ${vatNo || 'N/A'}`);
    doc.moveDown();

    doc.text(`Bill To: ${partyName}`);
    doc.moveDown();

    // Table Header
    const tableTop = 200;
    doc.font('Helvetica-Bold');
    doc.text("Description", 50, tableTop);
    doc.text("Qty", 300, tableTop, { width: 50, align: 'right' });
    doc.text("Rate", 350, tableTop, { width: 70, align: 'right' });
    doc.text("Amount", 420, tableTop, { width: 100, align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.font('Helvetica');

    // Table Rows
    let y = tableTop + 25;
    (items || []).forEach((item: any) => {
      doc.text(item.name || 'Item', 50, y);
      doc.text((item.qty || 0).toString(), 300, y, { width: 50, align: 'right' });
      doc.text((item.rate || 0).toFixed(2), 350, y, { width: 70, align: 'right' });
      doc.text((item.amount || 0).toFixed(2), 420, y, { width: 100, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc.font('Helvetica-Bold');
    doc.text("Total Amount (BDT):", 300, y);
    doc.text(totalAmount.toFixed(2), 420, y, { width: 100, align: 'right' });

    doc.moveDown(4);
    doc.fontSize(8).text("This is a computer generated document.", { align: 'center' });

    doc.end();
  });

  // Helper to run git commands safely without spawning a shell
  const runGitArgs = (args: string[]): { success: boolean; output: string } => {
    try {
      const output = execFileSync("git", args, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return { success: true, output: (output || "").trim() };
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString() : "";
      const stdout = err.stdout ? err.stdout.toString() : "";
      return { success: false, output: (stderr || stdout || err.message || "Unknown error").trim() };
    }
  };

  const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const validateSemverTag = (version: unknown): string => {
    if (typeof version !== "string") {
      throw new HttpError(400, "Invalid version format");
    }
    const trimmed = version.trim();
    if (!/^v?\d+\.\d+\.\d+(?:\.\d+)?$/.test(trimmed)) {
      throw new HttpError(400, "Invalid semantic version format");
    }
    return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
  };

  const validateBranchName = (branch: unknown): string => {
    if (typeof branch !== "string") {
      throw new HttpError(400, "Invalid branch name");
    }
    const trimmed = branch.trim();
    if (
      !trimmed ||
      trimmed.startsWith("-") ||
      trimmed.includes("..") ||
      trimmed.endsWith(".lock") ||
      !/^[a-zA-Z0-9._/-]{1,64}$/.test(trimmed)
    ) {
      throw new HttpError(400, "Invalid git branch name");
    }
    return trimmed;
  };

  const validateGitRemoteUrl = (remoteUrl: unknown): string => {
    if (remoteUrl === undefined || remoteUrl === null || remoteUrl === "") {
      return "";
    }
    if (typeof remoteUrl !== "string") {
      throw new HttpError(400, "Invalid remoteUrl");
    }
    const trimmed = remoteUrl.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("-")) {
      throw new HttpError(400, "Invalid remoteUrl");
    }
    const isHttpsGithub = /^https:\/\/github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(?:\.git)?$/.test(trimmed);
    const isSshGithub = /^git@github\.com:[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(?:\.git)?$/.test(trimmed);
    if (!isHttpsGithub && !isSshGithub) {
      throw new HttpError(400, "remoteUrl must be a valid GitHub HTTPS or SSH URL");
    }
    return trimmed;
  };

  const sanitizeGitText = (value: unknown, fallback: string, maxLen = 200): string => {
    const raw = typeof value === "string" ? value : "";
    const cleaned = raw.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();
    const bounded = (cleaned || fallback).slice(0, maxLen).trim();
    return bounded.startsWith("-") ? `Update ${bounded.replace(/^-+/, "").trim()}` : bounded;
  };

  // API: Get Git & Version Status (Founder Only)
  app.get("/api/github/status", authenticateFirebase, requireFounder, (req, res) => {
    try {
      const isGitRepo = fs.existsSync(path.resolve(process.cwd(), ".git"));
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, "utf8")) : {};
      
      let currentBranch = "main";
      let remoteUrl = "";
      let hasChanges = false;
      let lastCommit = "";
      let gitTags: string[] = [];
      let statusLog = "";

      if (isGitRepo) {
        const branchRes = runGitArgs(["rev-parse", "--abbrev-ref", "HEAD"]);
        if (branchRes.success) currentBranch = branchRes.output || "main";

        const remoteRes = runGitArgs(["config", "--get", "remote.origin.url"]);
        if (remoteRes.success) remoteUrl = remoteRes.output;

        const statusRes = runGitArgs(["status", "--porcelain"]);
        if (statusRes.success) {
          hasChanges = statusRes.output.length > 0;
          statusLog = statusRes.output;
        }

        const logRes = runGitArgs(["log", "-1", "--format=%h - %s (%cr)"]);
        if (logRes.success) lastCommit = logRes.output;

        const tagRes = runGitArgs(["tag", "-l"]);
        if (tagRes.success && tagRes.output) {
          gitTags = tagRes.output.split("\n").filter(Boolean);
        }
      }

      // Read releaseNotes.ts latest version
      let releaseNotesLatest = "v" + (pkg.version || "1.9.9");
      try {
        const rnPath = path.resolve(process.cwd(), "src/data/releaseNotes.ts");
        if (fs.existsSync(rnPath)) {
          const content = fs.readFileSync(rnPath, "utf8");
          const match = content.match(/export const LATEST_VERSION = ["']([^"']+)["']/);
          if (match && match[1]) releaseNotesLatest = match[1];
        }
      } catch (e) {}

      res.json({
        isGitRepo,
        currentBranch,
        remoteUrl,
        hasChanges,
        lastCommit,
        gitTags,
        statusLog,
        appVersion: releaseNotesLatest,
        packageVersion: pkg.version || "1.9.9",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Push Changes to GitHub
  // Helper function to update package.json, releaseNotes.ts and create Git commit & tag
  const applyReleaseUpdate = ({
    version = "v1.9.9",
    title = "",
    bnTitle = "",
    summary = "",
    bnSummary = "",
    newFeatures = [],
    improvements = [],
    bugFixes = [],
    commitMessage = ""
  }: any) => {
    const logs: string[] = [];
    const normalizedTag = validateSemverTag(version);
    const semVer = normalizedTag.replace(/^v/, "");
    const safeTitle = sanitizeGitText(title, "", 160);
    const safeCommitMsg = sanitizeGitText(commitMessage, "", 200);

    // 1. Synchronize package.json version
    logs.push(`Synchronizing package.json version to ${semVer}...`);
    const pkgPath = path.resolve(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = semVer;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    }

    // 2. Synchronize release notes in src/data/releaseNotes.ts
    logs.push(`Synchronizing Release Notes for ${normalizedTag}...`);
    const rnPath = path.resolve(process.cwd(), "src/data/releaseNotes.ts");
    if (fs.existsSync(rnPath)) {
      let rnContent = fs.readFileSync(rnPath, "utf8");
      
      // Update LATEST_VERSION
      rnContent = rnContent.replace(
        /export const LATEST_VERSION = ["'][^"']+["'];/,
        `export const LATEST_VERSION = "${normalizedTag}";`
      );

      // Set previous entries isLatest to false
      rnContent = rnContent.replace(/isLatest:\s*true/g, "isLatest: false");

      const today = new Date();
      const enDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
      const bnNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const toBnNum = (n: number | string) => String(n).split('').map(c => bnNumbers[Number(c)] ?? c).join('');
      const bnDate = `${toBnNum(today.getDate())} ${bnMonths[today.getMonth()]}, ${toBnNum(today.getFullYear())}`;

      const formattedFeatures = (Array.isArray(newFeatures) && newFeatures.length > 0 ? newFeatures : [
        {
          id: `feat-${normalizedTag.replace(/\./g, '-')}-core`,
          title: title || `Version ${normalizedTag} Rollout`,
          bnTitle: bnTitle || `সংস্করণ ${normalizedTag} আপডেট`,
          description: summary || `Application upgraded to version ${normalizedTag} with new features.`,
          bnDescription: bnSummary || `সিস্টেমের নতুন সংস্করণ ${normalizedTag} কার্যকর করা হয়েছে।`,
          module: "Core & Version Control",
          badge: "NEW"
        }
      ]).map((f: any, idx: number) => ({
        id: f.id || `feat-${normalizedTag.replace(/\./g, '-')}-${idx + 1}`,
        title: f.title || "Feature Update",
        bnTitle: f.bnTitle || f.title || "ফিচার আপডেট",
        description: f.description || "",
        bnDescription: f.bnDescription || f.description || "",
        module: f.module || "Core",
        badge: f.badge || "NEW"
      }));

      const formattedImprovements = (Array.isArray(improvements) ? improvements : []).map((imp: any, idx: number) => ({
        id: imp.id || `imp-${normalizedTag.replace(/\./g, '-')}-${idx + 1}`,
        title: imp.title || "System Improvement",
        bnTitle: imp.bnTitle || imp.title || "সিস্টেম উন্নয়ন",
        description: imp.description || "",
        bnDescription: imp.bnDescription || imp.description || "",
        module: imp.module || "Performance",
        badge: imp.badge || "IMPROVEMENT"
      }));

      const formattedBugFixes = (Array.isArray(bugFixes) ? bugFixes : []).map((fix: any, idx: number) => ({
        id: fix.id || `fix-${normalizedTag.replace(/\./g, '-')}-${idx + 1}`,
        title: fix.title || "Bug Fix",
        bnTitle: fix.bnTitle || fix.title || "বাগ সমাধান",
        description: fix.description || "",
        bnDescription: fix.bnDescription || fix.description || "",
        module: fix.module || "Bug Fix",
        badge: fix.badge || "FIX"
      }));

      const newReleaseObj = {
        version: normalizedTag,
        releaseDate: enDate,
        bnReleaseDate: bnDate,
        title: title || `Version ${normalizedTag} Release`,
        bnTitle: bnTitle || `সংস্করণ ${normalizedTag} রিলিজ`,
        summary: summary || `Application upgraded to version ${normalizedTag} with system improvements.`,
        bnSummary: bnSummary || `সিস্টেমের সার্বিক পারফরম্যান্স ও ফিচার উন্নয়নসহ সংস্করণ ${normalizedTag} কার্যকর করা হয়েছে।`,
        isLatest: true,
        newFeatures: formattedFeatures,
        improvements: formattedImprovements,
        bugFixes: formattedBugFixes
      };

      const serializedEntry = "  " + JSON.stringify(newReleaseObj, null, 2).replace(/\n/g, "\n  ") + ",\n";

      // If version entry already exists in release notes, replace it; otherwise prepend
      const versionRegex = new RegExp(`\\{\\s*version:\\s*["']${escapeRegExp(normalizedTag)}["'][\\s\\S]*?\\n\\s*\\},?`, 'm');
      if (versionRegex.test(rnContent)) {
        rnContent = rnContent.replace(versionRegex, serializedEntry.trimEnd());
      } else {
        rnContent = rnContent.replace(
          /(export const RELEASE_NOTES: ReleaseVersion\[\] = \[\n)/,
          `$1${serializedEntry}`
        );
      }

      fs.writeFileSync(rnPath, rnContent, "utf8");
    }

    // 3. Git Stage & Commit locally
    logs.push(`Staging local changes and creating release commit for ${normalizedTag}...`);
    runGitArgs(["add", "-A"]);
    const finalCommitMsg = `Release ${normalizedTag}: ${safeCommitMsg || safeTitle || 'System updates and release notes'}`;
    runGitArgs(["commit", "-m", finalCommitMsg, "--allow-empty"]);
    runGitArgs(["tag", "-fa", normalizedTag, "-m", `Release ${normalizedTag}`]);

    const hashRes = runGitArgs(["log", "-1", "--format=%h"]);

    return {
      success: true,
      normalizedTag,
      semVer,
      commitHash: hashRes.output || "HEAD",
      logs
    };
  };

  // API: Save and Publish Release Notes & Version Locally (Founder Only)
  app.post("/api/github/release", authenticateFirebase, requireFounder, (req, res) => {
    try {
      const result = applyReleaseUpdate(req.body || {});
      res.json({
        success: true,
        version: result.normalizedTag,
        commitHash: result.commitHash,
        message: `Version ${result.normalizedTag} & Release Notes successfully saved and committed! Click "Push changes to GitHub" in AI Studio to push to remote and deploy to Vercel.`,
        logs: result.logs.join("\n")
      });
    } catch (err: any) {
      const status = err instanceof HttpError ? err.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message
      });
    }
  });

  // API: Push Changes to GitHub (Founder Only)
  app.post("/api/github/push", authenticateFirebase, requireFounder, (req, res) => {
    const { 
      version = "v1.9.9", 
      commitMessage = "Release update", 
      branch = "main", 
      remoteUrl = "",
      releaseNoteTitle = "",
      releaseNoteSummary = "",
      bnTitle = "",
      bnSummary = "",
      newFeatures = [],
      improvements = [],
      bugFixes = []
    } = req.body || {};

    const logs: string[] = [];

    try {
      const normalizedTag = validateSemverTag(version);
      const validBranch = validateBranchName(branch);
      const validRemote = validateGitRemoteUrl(remoteUrl);
      const gitAuthorName = (process.env.GIT_AUTHOR_NAME || "ERP Release Bot").trim();
      const gitAuthorEmail = (process.env.GIT_AUTHOR_EMAIL || "release-bot@localhost").trim();

      logs.push(`[1/5] Initializing Git & Environment for ${normalizedTag}...`);
      const isGitRepo = fs.existsSync(path.resolve(process.cwd(), ".git"));
      if (!isGitRepo) {
        const initRes = runGitArgs(["init"]);
        logs.push(`git init: ${initRes.output}`);
      }

      runGitArgs(["config", "user.name", gitAuthorName]);
      runGitArgs(["config", "user.email", gitAuthorEmail]);
      runGitArgs(["branch", "-M", validBranch]);

      if (validRemote) {
        runGitArgs(["remote", "remove", "origin"]);
        const addRemoteRes = runGitArgs(["remote", "add", "origin", validRemote]);
        logs.push(`Configured remote origin: ${validRemote} (${addRemoteRes.success ? "OK" : addRemoteRes.output})`);
      }

      // 2. Synchronize release notes, package.json, and commit
      logs.push(`[2/5] Applying version bump and Release Notes synchronization...`);
      const updateResult = applyReleaseUpdate({
        version: normalizedTag,
        title: releaseNoteTitle,
        bnTitle,
        summary: releaseNoteSummary,
        bnSummary,
        newFeatures,
        improvements,
        bugFixes,
        commitMessage
      });
      logs.push(...updateResult.logs);

      // 3. Push to remote
      logs.push(`[3/5] Pushing to GitHub (${validBranch})...`);
      const remoteCheck = runGitArgs(["config", "--get", "remote.origin.url"]);
      let pushSuccess = false;
      let pushMessage = "";

      if (remoteCheck.success && remoteCheck.output) {
        const pushRes = runGitArgs(["push", "origin", validBranch, "--tags"]);
        logs.push(`git push: ${pushRes.output}`);
        if (pushRes.success) {
          pushSuccess = true;
          pushMessage = `Successfully pushed ${normalizedTag} to GitHub (${remoteCheck.output})`;
        } else {
          pushMessage = `Local commit & release notes created for ${normalizedTag}. Push notice: ${pushRes.output}`;
        }
      } else {
        pushMessage = `Version ${normalizedTag} and Release Notes committed locally. Set GitHub Remote URL or use AI Studio's "Push changes to GitHub" button to push to GitHub and trigger Vercel deployment.`;
        logs.push("No remote origin configured. Changes and release notes are committed and tagged locally.");
      }

      const hashRes = runGitArgs(["log", "-1", "--format=%h"]);

      res.json({
        success: true,
        pushSuccess,
        version: normalizedTag,
        commitHash: hashRes.output || "HEAD",
        message: pushMessage,
        logs: logs.join("\n")
      });
    } catch (err: any) {
      const status = err instanceof HttpError ? err.statusCode : 500;
      logs.push(`Error: ${err.message}`);
      res.status(status).json({
        success: false,
        error: err.message,
        logs: logs.join("\n")
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
