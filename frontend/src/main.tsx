import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Import Tailwind base styles first
import "./index.css";
// Import the custom App styles for the gaming theme
import "./App.css";

// Ensure the root element exists before rendering
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Failed to find the root element");
}

