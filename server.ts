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
import { execSync } from "child_process";

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

  // API: Firebase User Management - Add User
  app.post("/api/admin/users", authenticateFirebase, async (req: any, res) => {
    const { email, password, displayName, role, companyId } = req.body;

    try {
      // 1. Create User in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });

      // 2. Create User Profile in Firestore
      await getFirestoreInstance().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        role: role || 'staff',
        companyId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(201).json({ uid: userRecord.uid });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Firebase User Management - Delete User
  app.delete("/api/admin/users/:uid", authenticateFirebase, async (req: any, res) => {
    const { uid } = req.params;

    try {
      // 1. Delete from Firebase Auth
      await admin.auth().deleteUser(uid);

      // 2. Delete from Firestore
      await getFirestoreInstance().collection('users').doc(uid).delete();

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Firebase User Management - Reset Password
  app.post("/api/admin/users/:uid/reset-password", authenticateFirebase, async (req: any, res) => {
    const { uid } = req.params;
    const { newPassword } = req.body;

    try {
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

  // Helper to run shell commands safely
  const runGitCmd = (cmd: string): { success: boolean; output: string } => {
    try {
      const output = execSync(cmd, { cwd: process.cwd(), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      return { success: true, output: (output || "").trim() };
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString() : "";
      const stdout = err.stdout ? err.stdout.toString() : "";
      return { success: false, output: (stderr || stdout || err.message || "Unknown error").trim() };
    }
  };

  // API: Get Git & Version Status
  app.get("/api/github/status", (req, res) => {
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
        const branchRes = runGitCmd("git rev-parse --abbrev-ref HEAD");
        if (branchRes.success) currentBranch = branchRes.output || "main";

        const remoteRes = runGitCmd("git config --get remote.origin.url");
        if (remoteRes.success) remoteUrl = remoteRes.output;

        const statusRes = runGitCmd("git status --porcelain");
        if (statusRes.success) {
          hasChanges = statusRes.output.length > 0;
          statusLog = statusRes.output;
        }

        const logRes = runGitCmd('git log -1 --format="%h - %s (%cr)"');
        if (logRes.success) lastCommit = logRes.output;

        const tagRes = runGitCmd("git tag -l");
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
    const normalizedTag = version.startsWith("v") ? version : `v${version}`;
    const semVer = normalizedTag.replace(/^v/, "");

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
      const versionRegex = new RegExp(`\\{\\s*version:\\s*["']${normalizedTag}["'][\\s\\S]*?\\n\\s*\\},?`, 'm');
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
    runGitCmd("git add -A");
    const finalCommitMsg = `Release ${normalizedTag}: ${commitMessage.trim() || title.trim() || 'System updates and release notes'}`;
    const commitRes = runGitCmd(`git commit -m "${finalCommitMsg}" --allow-empty`);
    runGitCmd(`git tag -fa "${normalizedTag}" -m "Release ${normalizedTag}"`);

    const hashRes = runGitCmd('git log -1 --format="%h"');

    return {
      success: true,
      normalizedTag,
      semVer,
      commitHash: hashRes.output || "HEAD",
      logs
    };
  };

  // API: Save and Publish Release Notes & Version Locally
  app.post("/api/github/release", (req, res) => {
    try {
      const result = applyReleaseUpdate(req.body);
      res.json({
        success: true,
        version: result.normalizedTag,
        commitHash: result.commitHash,
        message: `Version ${result.normalizedTag} & Release Notes successfully saved and committed! Click "Push changes to GitHub" in AI Studio to push to remote and deploy to Vercel.`,
        logs: result.logs.join("\n")
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // API: Push Changes to GitHub
  app.post("/api/github/push", (req, res) => {
    const { 
      version = "v1.9.9", 
      commitMessage = "Release update", 
      branch = "main", 
      remoteUrl = "",
      autoTag = true,
      releaseNoteTitle = "",
      releaseNoteSummary = "",
      bnTitle = "",
      bnSummary = "",
      newFeatures = [],
      improvements = [],
      bugFixes = []
    } = req.body;

    const logs: string[] = [];
    const normalizedTag = version.startsWith("v") ? version : `v${version}`;

    try {
      logs.push(`[1/5] Initializing Git & Environment for ${normalizedTag}...`);
      const isGitRepo = fs.existsSync(path.resolve(process.cwd(), ".git"));
      if (!isGitRepo) {
        const initRes = runGitCmd("git init");
        logs.push(`git init: ${initRes.output}`);
      }

      runGitCmd('git config user.name "TallyFlow ERP"');
      runGitCmd('git config user.email "bot@tallyflow.erp"');
      runGitCmd(`git branch -M ${branch}`);

      if (remoteUrl && remoteUrl.trim()) {
        const cleanRemote = remoteUrl.trim();
        runGitCmd("git remote remove origin");
        const addRemoteRes = runGitCmd(`git remote add origin ${cleanRemote}`);
        logs.push(`Configured remote origin: ${cleanRemote} (${addRemoteRes.success ? "OK" : addRemoteRes.output})`);
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
      logs.push(`[3/5] Pushing to GitHub (${branch})...`);
      const remoteCheck = runGitCmd("git config --get remote.origin.url");
      let pushSuccess = false;
      let pushMessage = "";

      if (remoteCheck.success && remoteCheck.output) {
        const pushRes = runGitCmd(`git push origin ${branch} --tags`);
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

      const hashRes = runGitCmd('git log -1 --format="%h"');

      res.json({
        success: true,
        pushSuccess,
        version: normalizedTag,
        commitHash: hashRes.output || "HEAD",
        message: pushMessage,
        logs: logs.join("\n")
      });
    } catch (err: any) {
      logs.push(`Error: ${err.message}`);
      res.status(500).json({
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
