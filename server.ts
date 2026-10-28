import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({});
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint for deployment probes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini Bot Draft Post API
  app.post('/api/gemini/draft-post', async (req, res) => {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'กรุณาระบุหัวข้อหรือแนวคิดโพสต์' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' });
    }

    try {
      const prompt = `คุณคือ SkillsWop Demo Bot (User ID: SWP000001) ผู้ช่วยเขียนโพสต์ของคอมมูนิตี้แลกเปลี่ยนวิชาและทักษะ SkillsWop
ผู้ใช้ส่งแนวคิดหรือหัวข้อสั้น ๆ มาว่า: "${topic}"

กรุณาช่วยสร้างร่างโพสต์ภาษาไทยที่อ่านเป็นธรรมชาติ น่าสนใจ แบ่งวรรคตอนชัดเจน และลงท้ายด้วยการเชิญชวนเพื่อนๆ ในชุมชนแลกเปลี่ยนวิชากัน
ตอบกลับเป็น JSON ตามโครงสร้างนี้:
- title: หัวข้อโพสต์ที่กระชับและน่าสนใจ
- content: เนื้อหาโพสต์ภาษาไทยพร้อมคำแนะนำและเชิญชวนแลกเปลี่ยน
- skillTags: แท็กทักษะ 2-4 แท็ก
- category: หมวดหมู่ เลือกหนึ่งใน ["แชร์ความรู้", "แนะนำวิชา", "เทคนิคการเรียน", "ผลงาน", "ขอคำแนะนำ", "ทั่วไป"]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              skillTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              category: { type: Type.STRING },
            },
            required: ['title', 'content', 'skillTags', 'category'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini post draft error:', err);
      return res.status(500).json({ error: err?.message || 'Gemini generation failed' });
    }
  });

  // Vite middleware for development, static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
