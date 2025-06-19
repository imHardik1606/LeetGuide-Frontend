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

      // const prompt = `
      //   You are an AI mentor guiding a LeetCode user who is preparing for Big Tech interviews (Google, Amazon, Meta) and also actively working on improving in Competitive Programming (CP). Analyze their data below and provide focused, personalized feedback within 200 words.

      //   User Data:
      //   - Skill Stats: ${JSON.stringify(data.skillStats)}
      //   - Contest Data: ${JSON.stringify(data.contestRanking)}
      //   - Solved Stats: ${JSON.stringify(data.solved)}
      //   - Recent Submissions: ${JSON.stringify(data.recentSubmissions)}

      //   Your response must include:
      //   1. Topics they are strong/weak in (based on tag counts).
      //   2. DSA areas to prioritize for Big Tech interviews (with reasons).
      //   3. CP-specific feedback based on contest participation/performance.
      //   4. Comments on their consistency (from submissions & contests) and how to improve it.
      //   5. Give 3–5 short, actionable improvement tips (e.g., "Solve 3 new Hard-level Graph problems this week").

      //   Constraints:
      //   - Be specific, structured, and under 200 words.
      //   - No generic advice — mention patterns, gaps, or neglected areas.
      //   - Friendly but sharp — like a focused coding coach, not a cheerleader.
      //   - Respond in plain text only (no formatting or markdown).
      //   - Always start with appreciation and username

      //   Always answer in the following format: 
      //   Okay, LeetCode user, here's your analysis:
      //   Strengths:
      //   Your fundamentals (Arrays, Strings) and intermediate skills (Hash Tables, Greedy) are solid. 
      //   Weak areas:
      //   Game Theory, Bitmask, and topics you haven't yet started.

      //   For Big Tech interviews, prioritize Graphs (more Hard problems), Trees (esp. Binary Trees), and System Design. Refine DP; 71 problems is good, but ensure you can apply the concepts quickly.

      //   For CP, rating ~1788 is respectable, but aim for higher consistency. 18 contests shows some engagement. Target weekly virtual contests to build speed.
      //   Submission history suggests some daily activity but can be more consistent.

      //   Actionable tips:
      //   1. Solve 3 new Hard-level Graph problems this week.
      //   2. Complete all Blind 75 problems if you haven't already.
      //   3. Participate in at least 2 virtual contests per week.
      //   4. Solve 1 Game Theory problem and 1 Bitmask problem per week.
      //   5. Implement solutions to the top 5 most frequent interview questions.
      // `;
      const prompt = `
          You are an AI coding strategist guiding a LeetCode user preparing for Big Tech interviews (Google, Amazon, Meta) and practicing Competitive Programming (CP). Based on the user’s performance data below, generate a tight, expert-level review — no more than 200 words.

          User Data:
          - Skill Stats: ${JSON.stringify(data.skillStats)}
          - Contest History: ${JSON.stringify(data.contestRanking)}
          - Problems Solved: ${JSON.stringify(data.solved)}
          - Recent Submissions: ${JSON.stringify(data.recentSubmissions)}

          Instructions — your analysis must:
          - Start with a short, appreciative note using the username.
          - Clearly label and separate the following sections:
            1. **Strengths**: Tags/topics with high problem count or strong coverage.
            2. **Weaknesses**: Underserved or untouched topics that need attention.
            3. **Big Tech Focus**: 2–3 specific DSA areas to prioritize with reasons.
            4. **CP Insights**: Analysis of contest performance, frequency, rating trend.
            5. **Consistency Review**: Daily/weekly activity pattern and improvement tips.
            6. **Action Plan**: 3–5 tailored, impactful tasks. Be direct (e.g., "Solve 3 Hard-level Graph problems").

          Output Constraints:
          - No markdown, formatting — plain text only.
          - No generic advice — base everything strictly on provided stats.
          - Be concise, insightful, and solution-focused.
          - Write like a sharp technical coach — encouraging, not flattering.
          - You can use Emojis with section headings.
          - End with: "Stay consistent — sharp minds win."

          Your output should **strictly follow this structure**:
          Okay, [username], here's your performance breakdown:

          Strengths:
          ...

          Weaknesses:
          ...

          Big Tech Focus:
          ...

          CP Insights:
          ...

          Consistency Review:
          ...

          Action Plan:
          ...

          Always end with a motivational line.
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
        browserInfo: getBrowserName(),
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

  const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
  return "Unknown";
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
