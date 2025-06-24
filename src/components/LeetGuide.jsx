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
    const endpointMap = {
      name: "name",
      skillStats: "skillStats",
      solved: "solved",
      contestRanking: "contest",
      recentSubmissions: "recent",
    };

    const results = await Promise.allSettled(
      Object.values(endpointMap).map((endpoint) =>
        fetchWithRetry(`${API_BASE_URL}/${username}/${endpoint}`)
      )
    );

    const data = {};
    let allFailed = true;

    Object.keys(endpointMap).forEach((key, index) => {
      const result = results[index];
      if (result.status === "fulfilled" && result.value?.data) {
        data[key] = result.value.data;
        allFailed = false;
      } else {
        data[key] = null;
      }
    });

    if (allFailed || !data.skillStats || !data.solved) {
      throw new Error("UserNotFound");
    }

    return data;
  };

  const generateGuidance = async () => {
    if (!username.trim()) {
      setError("Please enter a valid username");
      return;
    } else {
      setError("");
    }

    const cacheKey = `leet-${username}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const isFresh =
        Date.now() - new Date(parsed.timestamp).getTime() < 1000 * 60 * 10;
      if (isFresh) {
        setGuidance(parsed.guidance);
        setShowGuide(true);
        return;
      }
    }

    setIsLoading(true);
    setShowGuide(false);
    setError("");

    try {
      const data = await getLeetUserData(username);

      const prompt = `
    You are a sharp, no-fluff AI coding strategist reviewing a LeetCode user's progress for Big Tech interviews (Google, Amazon, Meta) and Competitive Programming goals. Based on the user’s performance data below, generate a laser-focused performance review in **under 200 words**.

    User Data:
    - User's name: ${JSON.stringify(data.name)}
    - Skill Stats: ${JSON.stringify(data.skillStats)}
    - Contest History: ${JSON.stringify(data.contestRanking)}
    - Problems Solved: ${JSON.stringify(data.solved)}
    - Recent Submissions: ${JSON.stringify(data.recentSubmissions)}

    Instructions — your analysis **must**:
    - No emojis before at the start of the response.
    - Start with a rotating exclamatory remark (e.g., "Wow!", "Genius!", "Impressive!", "Brilliant!") before addressing the user by name.
    - Do NOT mention the total number of problems solved anywhere.
    - If latest submission is older than 2 days or more in past, **highlight the gap** and urge the user to be consistent.
    - If contest participation is missing or fewer than 3, **strongly recommend** joining upcoming contests with a solid reason why.
    - Clearly divide your review into the following **plain text** sections (no markdown, no asterisks, no number lists):

    Format strictly like this (replace [username]):

    [Exclamation] [realname], here's your performance breakdown:

    Strengths:
    State strong topic areas or skill categories based on high performance. Be precise.

    Weaknesses:
    Point out areas with low activity or poor mastery. Focus on where improvement is needed.

    Big Tech Focus:
    Recommend 2–3 high-impact DSA areas to target (e.g., Trees, Graphs, DP) and explain why each is important for Big Tech interviews.

    CP Insights:
    Evaluate contest activity, consistency, and performance. If fewer than 3 contests, push to join upcoming ones and explain how it builds pressure-handling and speed.

    Consistency Review:
    Assess submission frequency. If the last activity is older than 2 days, call it out directly. Suggest building a daily habit.

    Action Plan:
    List 3–5 direct, impactful tasks personalized to the user's profile (e.g., "Master Sliding Window with 2 Medium problems and 1 Hard").

    Important Constraints:
    - No markdown or formatting syntax.
    - No vague advice — tailor everything to the provided stats only.
    - Use emojis for each section heading to improve readability.
    - End with this exact motivational line: Stay consistent — sharp minds win.
`;

      const aiResponse = await getAIResponse(prompt);

      if (!aiResponse || aiResponse.trim() === "") {
        throw new Error("EmptyAIResponse");
      }

      setGuidance(aiResponse);
      setShowGuide(true);

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ guidance: aiResponse, timestamp: new Date().toISOString() })
      );

      await axios.post(`${API_BASE_URL}/saveReport`, {
        username,
        output: aiResponse,
        dateTime: new Date().toISOString(),
        browserInfo: `${getBrowserName()} on ${getOS()}`
      });
    } catch (err) {
      console.error("Guidance Error:", err);

      if (err.message === "UserNotFound") {
        setError("User not found. Please check the username and try again.");
      } else if (err.message === "EmptyAIResponse") {
        setError("AI failed to generate a response. Please try again.");
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
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR"))
      return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Edg")) return "Edge";
    if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
    return "Unknown";
  };

  const getOS = () => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("win")) return "Windows";
  if (platform.includes("mac")) return "macOS";
  if (platform.includes("linux")) return "Linux";
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
          onChange={(val) => {
            setUsername(val);
            setError(""); // Clear error on typing
          }}
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
