import React, { useState } from "react";
import axios from "axios";
import InputBox from "./InputBox";
import OutputBox from "./OutputBox";
import { getAIResponse } from "../service/gemini";

const LeetGuide = () => {
  const [username, setUsername] = useState("");
  const [guidance, setGuidance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, retries = 3, delayMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url);
      } catch (err) {
        if (err.response?.status === 429 && i < retries - 1) {
          await delay(delayMs * Math.pow(2, i));
        } else {
          throw err;
        }
      }
    }
  };

  const getLeetUserData = async (username) => {
    const endpoints = [
      `${username}/skillStats`,
      `${username}/solved`,
      `${username}/contest`,
      `${username}/recent`,
    ];

    const requests = endpoints.map((endpoint) =>
      fetchWithRetry(`${API_BASE_URL}/${endpoint}`).catch((err) => {
        // Rethrow to detect individual 404
        if (err.response?.status === 404) throw new Error("UserNotFound");
        throw err;
      })
    );

    try {
      const [skillStatsRes, solvedRes, contestRes, recentSubsRes] =
        await Promise.all(requests);

      return {
        skillStats: skillStatsRes.data,
        solved: solvedRes.data,
        contestRanking: contestRes.data,
        recentSubmissions: recentSubsRes.data,
      };
    } catch (err) {
      if (err.message === "UserNotFound") {
        throw new Error("UserNotFound");
      }
      throw err;
    }
  };

  const generateGuidance = async () => {
    if (!username.trim()) {
      setError("Please enter a valid username");
      return;
    }

    const cacheKey = `leet-${username}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setGuidance(parsed.guidance);
      setShowGuide(true);
      return;
    }

    setIsLoading(true);
    setShowGuide(false);
    setError("");

    try {
      const data = await getLeetUserData(username);

      const prompt = `
        You are an AI mentor guiding a LeetCode user who is preparing for Big Tech interviews (Google, Amazon, Meta) and also actively working on improving in Competitive Programming (CP). Analyze their data below and provide focused, personalized feedback within 200 words.

        User Data:
        - Skill Stats: ${JSON.stringify(data.skillStats)}
        - Contest Data: ${JSON.stringify(data.contestRanking)}
        - Solved Stats: ${JSON.stringify(data.solved)}
        - Recent Submissions: ${JSON.stringify(data.recentSubmissions)}

        Your response must include:
        1. Topics they are strong/weak in (based on tag counts).
        2. DSA areas to prioritize for Big Tech interviews (with reasons).
        3. CP-specific feedback based on contest participation/performance.
        4. Comments on their consistency (from submissions & contests) and how to improve it.
        5. Give 3–5 short, actionable improvement tips (e.g., "Solve 3 new Hard-level Graph problems this week").

        Constraints:
        - Be specific, structured, and under 200 words.
        - No generic advice — mention patterns, gaps, or neglected areas.
        - Friendly but sharp — like a focused coding coach, not a cheerleader.
        - Respond in plain text only (no formatting or markdown).
        - Always start with appreciation and username
      `;

      const aiResponse = await getAIResponse(prompt);
      setGuidance(aiResponse);
      setShowGuide(true);

      sessionStorage.setItem(cacheKey, JSON.stringify({ guidance: aiResponse }));

      // Save to DB
      await axios.post(`${API_BASE_URL}/saveReport`, {
        username,
        output: aiResponse,
        dateTime: new Date().toISOString(),
        browserInfo: navigator.userAgent,
      });
    } catch (err) {
      console.error("Guidance Error:", err);

      if (err.message === "UserNotFound") {
        setError("User not found. Please check the username and try again.");
      } else if (err.response?.status === 429) {
        setError("Rate limit exceeded. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }

      setShowGuide(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">LeetGuide</h1>
          <p className="text-gray-600">
            Provide your Leetcode username, get personalized guidance 📈
          </p>
        </div>

        <InputBox
          value={username}
          onChange={setUsername}
          onSubmit={generateGuidance}
          isLoading={isLoading}
          buttonLabel={isLoading ? "Analyzing..." : "Get Guidance"}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <OutputBox
          guidance={guidance}
          isVisible={showGuide}
          username={username}
          title="Personalized Guidance"
        />

        <div className="text-center mt-8 text-md text-gray-500">
          Made by{" "}
          <span className="text-blue-500 font-bold">
            <a
              href="https://github.com/imHardik1606"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hardik
            </a>
          </span>{" "}
          🔗
        </div>
      </div>
    </div>
  );
};

export default LeetGuide;
