import React, { useState } from "react";
import axios from "axios";
import InputBox from "./InputBox";
import OutputBox from "./OutputBox";

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
      `skillStats/${username}`,
      `${username}/solved`,
      `${username}/contest`,
      `${username}/submission?limit=10`,
    ];
    const requests = endpoints.map((endpoint) =>
      fetchWithRetry(`${API_BASE_URL}/${endpoint}`)
    );
    const [skillStatsRes, solvedRes, contestRes, recentSubsRes] =
      await Promise.all(requests);

    return {
      skillStats: skillStatsRes.data,
      solved: solvedRes.data,
      contestRanking: contestRes.data,
      recentSubmissions: recentSubsRes.data,
    };
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
      const prompt = `
You are an AI mentor helping a LeetCode user improve their skills. Analyze their performance using the data below and give clear, personalized feedback.

User's Data:
- Skill Stats: ${JSON.stringify(data.skillStats)}
- Contest Data: ${JSON.stringify(data.contestRanking)}
- Solved Stats: ${JSON.stringify(data.solved)}
- Recent Submissions: ${JSON.stringify(data.recentSubmissions)}

Your response must include:
1. Topics they are strong in and weak in (based on tag counts).
2. Which DSA concepts they should focus more on and why.
3. Comment on their consistency (look at submission and contest trends) and how to improve it.
4. Should they attend more contests? If yes, why and how often.
5. Provide 3–5 practical and actionable improvement tips (e.g., “Try 5 new hard-level DP problems this week”).

Be specific. Keep the tone friendly but to the point — like a coding coach, not a cheerleader. Avoid generic advice. Mention any patterns, topic neglect, or strong trends you see.
`;

      sessionStorage.setItem(cacheKey, JSON.stringify({ guidance: prompt }));
      setGuidance(prompt);
      setShowGuide(true);

      const saveToDB = async () => {
        try {
          await axios.post(`${API_BASE_URL}/api/saveReport`, {
            username,
            output: prompt,
            dateTime: new Date().toISOString(),
            browserInfo: navigator.userAgent,
          });
          console.log("Saved to MongoDB");
        } catch (err) {
          console.error("MongoDB Save Error:", err);
        }
      };

      await saveToDB();
    } catch (error) {
      console.error("API Error:", error);
      if (error.response?.status === 404) {
        setError("User not found. Please check the username and try again.");
      } else if (error.response?.status === 429) {
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
