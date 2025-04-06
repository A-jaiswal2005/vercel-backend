const functions = require("firebase-functions");
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: 'https://fitness-soul-9277b.web.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Apply CORS middleware globally with the specified options
app.use(cors(corsOptions));

app.use(express.json());

const GEMINI_API_KEY = "AIzaSyAxOsBusVANIFO75O-EqxK_z1ac7peyQCI";

async function fetchGeminiResponse(prompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    const rawText = response.data.candidates[0].content.parts[0].text;
    const jsonString = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    throw error;
  }
}

app.post('/exercise-plan', async (req, res) => {
  try {
    const userData = req.body;

    const prompt = `
Create a 7-day workout plan for an Indian ${userData.gender} of age ${userData.age}, height = ${userData.height} cm, weight = ${userData.weight} kg, focused on ${userData.goal.replace('-', ' ')}, and has injury in ${userData.injury}.
Include warm-up, main exercises, and cooldown for each day.

Also include general notes. Use this JSON format strictly:
{
  "workoutPlan": {
    "description": "...",
    "days": {
      "Monday": {
        "focus": "...",
        "exercises": [
          { "name": "", "repetitions": "", "sets": "" }
        ],
        "notes": "..."
      },
      ...
    },
    "generalNotes": "..."
  }
}
`.trim();

    const result = await fetchGeminiResponse(prompt);
    res.json(result);
  } catch (err) {
    console.error("Exercise Plan Error:", err);
    res.status(500).json({ error: "Failed to generate exercise plan" });
  }
});

app.post('/diet-plan', async (req, res) => {
  try {
    const userData = req.body;

    const prompt = `
Suggest a weekly balanced diet plan for a ${userData.age}-year-old Indian ${userData.gender} who follows a ${userData.diet} diet.
Goal: ${userData.goal.replace('-', ' ')}, Experience: ${userData.experience}.

Return a weekly plan from Monday to Sunday in this JSON format:
{
  "dietPlan": {
    "description": "...",
    "weeklyPlan": {
      "Monday": {
        "Breakfast": { "items": [...], "calories": ..., "protein": "...", "notes": "..." },
        "Lunch": { ... },
        "Dinner": { ... },
        "Snacks": { ... }
      },
      ...
      "Sunday": { ... }
    },
    "generalTips": "..."
  }
}
`.trim();

    const result = await fetchGeminiResponse(prompt);
    res.json(result);
  } catch (err) {
    console.error("Diet Plan Error:", err);
    res.status(500).json({ error: "Failed to generate diet plan" });
  }
});

/**
 * Firebase Cloud Functions for handling exercise and diet plan requests.
 */
exports.app = functions.https.v2.onRequest(app);