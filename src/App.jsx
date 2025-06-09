import React, { useState } from "react";
import ActivityGraph from "./ActivityGraph";
import './App.css';

function randomData() {
  const arr = [];
  const now = new Date();
  for (let i = 0; i < 365; ++i) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const n = Math.floor(Math.random() * 25);
    for (let j = 0; j < n; ++j) {
      arr.push(
        new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60)
        ).toISOString()
      );
    }
  }
  return arr;
}

export default function App() {
  const [data, setData] = useState(randomData());
  const [inactiveColor, setInactiveColor] = useState("#ebedf0");
  const [activeColor, setActiveColor] = useState("#216e39");
  const [startDayOfTheWeek, setStartDayOfTheWeek] = useState(0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Activity Graph Demo</h1>
      <div style={{ marginBottom: 16 }}>
        <label>
          "Неактивний" колір:{" "}
          <input
            type="color"
            value={inactiveColor}
            onChange={(e) => setInactiveColor(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          "Активний" колір:{" "}
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          Початковий день тижня:{" "}
          <select
            value={startDayOfTheWeek}
            onChange={(e) => setStartDayOfTheWeek(Number(e.target.value))}
          >
            <option value={0}>Понеділок</option>
            <option value={6}>Неділя</option>
          </select>
        </label>
        <button
          style={{ marginLeft: 16 }}
          onClick={() => setData(randomData())}
        >
          Рандомізувати дані
        </button>
      </div>
      <ActivityGraph
        data={data}
        colors={{ inactiveColor, activeColor }}
        startDayOfTheWeek={startDayOfTheWeek}
        adaptive={true}
      />
    </div>
  );
}

import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("No root element found!");
}
