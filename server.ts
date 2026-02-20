import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("timetable.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    dayOfWeek INTEGER NOT NULL,
    category TEXT,
    color TEXT,
    completed INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    color TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes - Activities
  app.get("/api/activities", (req, res) => {
    const activities = db.prepare("SELECT * FROM activities ORDER BY startTime").all();
    res.json(activities);
  });

  app.post("/api/activities", (req, res) => {
    const { title, startTime, endTime, dayOfWeek, category, color } = req.body;
    const info = db.prepare(
      "INSERT INTO activities (title, startTime, endTime, dayOfWeek, category, color) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(title, startTime, endTime, dayOfWeek, category, color);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/activities/:id/toggle", (req, res) => {
    db.prepare("UPDATE activities SET completed = 1 - completed WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/activities/:id", (req, res) => {
    db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // API Routes - Templates
  app.get("/api/templates", (req, res) => {
    const templates = db.prepare("SELECT * FROM templates").all();
    res.json(templates);
  });

  app.post("/api/templates", (req, res) => {
    const { title, category, color } = req.body;
    const info = db.prepare(
      "INSERT INTO templates (title, category, color) VALUES (?, ?, ?)"
    ).run(title, category, color);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/templates/:id", (req, res) => {
    db.prepare("DELETE FROM templates WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
