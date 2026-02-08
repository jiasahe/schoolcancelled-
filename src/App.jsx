import { useState } from "react";
import "./App.css";

const API_KEY = "PASTE_OPENWEATHER_API_KEY";

export default function App() {
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("normal");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function predict() {
    setLoading(true);
    setResult(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      let snowTotal = 0;
      let freezingHours = 0;
      let temps = [];

      data.list.slice(0, 24).forEach(h => {
        temps.push(h.main.temp);
        if (h.snow) snowTotal += h.snow["3h"] || 0;
        if (h.main.temp < 0) freezingHours++;
      });

      const trendDrop = temps[temps.length - 1] < temps[0] ? 10 : 0;

      let score = snowTotal * 6 + freezingHours * 2 + trendDrop;

      // momentum: already bad yesterday
      if (snowTotal > 5) score += 20;

      const districtMultiplier = {
        lenient: 1.3,
        normal: 1.0,
        strict: 0.7
      };

      score = Math.min(Math.round(score * districtMultiplier[district]), 100);

      const verdict =
        score >= 75
          ? "YES — school is getting cancelled ❄️"
          : score >= 45
          ? "Maybe — admins are debating 😬"
          : "No — set your alarm ⏰";

      setResult({ score, verdict });
    } catch {
      setResult({ error: true });
    }

    setLoading(false);
  }

  return (
    <div className="container">
      <h1>Will School Be Cancelled?</h1>
      <p className="subtitle">Multi-day, behavior-based snow prediction</p>

      <input
        placeholder="Enter city"
        value={city}
        onChange={e => setCity(e.target.value)}
      />

      <select value={district} onChange={e => setDistrict(e.target.value)}>
        <option value="lenient">Southern / Rare Snow</option>
        <option value="normal">Average District</option>
        <option value="strict">Snow-State District</option>
      </select>

      <button onClick={predict} disabled={loading}>
        {loading ? "Analyzing..." : "Predict"}
      </button>

      {result && !result.error && (
        <div className="card">
          <h2>{result.verdict}</h2>
          <p className="score">Chance: {result.score}%</p>
        </div>
      )}

      {result?.error && <p>City not found.</p>}
    </div>
  );
}
