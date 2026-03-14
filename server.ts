import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import PDFDocument from "pdfkit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      doc.text(item.name, 50, y);
      doc.text(item.qty.toString(), 300, y, { width: 50, align: 'right' });
      doc.text(item.rate.toFixed(2), 350, y, { width: 70, align: 'right' });
      doc.text(item.amount.toFixed(2), 420, y, { width: 100, align: 'right' });
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
