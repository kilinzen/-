import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or has placeholder value.");
}

// API endpoint for generating viral TikTok scripts & monetization tactics using Gemini
app.post("/api/viral-studio", async (req, res) => {
  try {
    const { skinName, currentStage, highScore, metaUpgrades, playerPrompt } = req.body;

    if (!ai) {
      // Graceful fallback with humorous offline response if Gemini is not initialized or API key is missing
      return res.json({
        success: true,
        isFallback: true,
        script: `🎬 **[OFFLINE FORMULA — CONNECT GEMINI KEY FOR AI GENERATION]**

🔥 **TikTok Screen Split Concept:** 
[Top Screen]: Glowing Number Snake Runner gliding through an insane x5 multiplier gate, smashing a Level 15 Volcano Dragon!
[Bottom Screen]: Satisfying kinetic sand cutting video.

💬 **Overlay Caption:** "If I don't reach Level 100 on my ${skinName || 'Standard Snake'} today, I am deleting my phone!"

🎙️ **Fast-paced Voiceover (0-7s):** "Okay, check this out. My ${skinName || 'Standard'} snake is currently running with a base score of ${highScore || 250}. Everyone on TikTok said it's impossible to pass Section ${currentStage || 1}. But they forgot I upgraded our door shields to maximum!"

🎮 **Action Beat (0-15s):** "Watch me dodge this -50 gate. Swipe right, slide left! Squeezed into the x3 gate! Yes! Boom, we hit 750 size! The Dragon has only 600 health, we are ABSOLUTELY SMASHING IT!"

🌟 **Call to Action (15-20s):** "Drop a follow, let me know if you can beat my stage score of ${highScore || 250}. Code: SNAKEVIRAL at checkout."

🏷️ **Viral Tags:** #SnakeRunner #NumberGrowth #GamingVids #SatisfyingGames #GamingOnTikTok`,
        strategyBlueprint: "📌 **Offline Strategy Tips:** Focus on leveling up your Door Shield to survive negative gate surprises. Save your gold for Helmet upgrades which boost gate multiplication factors by 20% per tier!"
      });
    }

    const systemInstruction = 
      "You are a viral gaming TikTok / YouTube Shorts marketing director, copywriter, and high-conversion content strategist. " +
      "You design super-addictive hooks, screen-split gameplay scripts, and psychology-backed retention hooks for mobile games. " +
      "Use energetic, extremely punchy, TikTok-adapted language (bold titles, emoji cues, time stamps, voicover guidelines).";

    const prompt = `Write a viral TikTok video script and tactical monetization/gaming advice for our mobile game 'Number Snake Idle Survivor'!
    Here are the player's session details to adapt into the script dynamically:
    - Equipped Hero Skin: ${skinName || "Standard Little Blue Snake"}
    - Current Stage Accomplished: Stage ${currentStage || 1}
    - Player High Score: ${highScore || 100} points
    - Permanent Upgrades Level: ${JSON.stringify(metaUpgrades || {})}
    ${playerPrompt ? `- Player Custom Prompt/Challenge: "${playerPrompt}"` : ""}

    Generate a JSON response structured exactly like:
    {
      "script": "A detailed TikTok script with visual cues, overlay text captions, fast speaker voiceover, sound effect triggers, and 2-second dopamine hit markers.",
      "strategyBlueprint": "A bulleted list explaining why this gameplay format hooks viewers, plus a specialized strategy tip for this specific player configuration."
    }
    Make sure you return valid JSON conforming to this response structure. Use double quotes and escape characters properly! Do NOT wrapper in markdown blocks in your text output unless configured correctly. Let's request JSON response explicitly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            script: { type: "STRING" as any, description: "Detailed high-converting TikTok script with voiceover and Visual cues." },
            strategyBlueprint: { type: "STRING" as any, description: "Analysis of the viral hook, and tactical run advice." }
          },
          required: ["script", "strategyBlueprint"]
        }
      }
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || "{}"));

  } catch (error: any) {
    console.error("Gemini request failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating script content.",
    });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    console.log("Vite development middleware integrated successfully.");
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting. Tuning successfully into http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server framework:", err);
});
