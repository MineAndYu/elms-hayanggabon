import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API routes
app.post("/api/notify", async (req, res) => {
  const { studentName, status, parentPhone, date } = req.body;
  
  let messageText = `EduTrack Pro: ${studentName} was marked ${status} on ${date}.`;
  
  // Optionally use Gemini to generate a more detailed/polite message
  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short, professional SMS notification for a parent. 
        Student name: ${studentName}. 
        Status: ${status} (present, absent, or tardy). 
        Date: ${date}. 
        Keep it under 160 characters.`,
      });
      
      messageText = response.text || messageText;
    } catch (error) {
      console.error("Gemini generation failed, using fallback message:", error);
    }
  }

  // MOCK SMS SENDING
  console.log(`[SMS SENT to ${parentPhone}]: ${messageText}`);
  
  res.json({ success: true, message: "Notification sent (mocked)", content: messageText });
});

app.post("/api/emergency-send", async (req, res) => {
  const { title, content, recipients } = req.body;
  
  // MOCK BULK SMS SENDING
  console.log(`[EMERGENCY SMS SENT to ${recipients.length} recipients]`);
  console.log(`Title: ${title}\nContent: ${content}`);
  
  res.json({ success: true, message: "Emergency notifications sent to parents" });
});

async function startServer() {
  if (path.resolve(process.cwd(), 'dist')) {
    // Production
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
