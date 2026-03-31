import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import PDFDocument from "pdfkit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.ts";
import admin from "firebase-admin";
import fs from "fs";

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
      await admin.firestore().collection('users').doc(userRecord.uid).set({
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
      await admin.firestore().collection('users').doc(uid).delete();

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
