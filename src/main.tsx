import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAppConfig } from "./lib/appConfig";

// Eagerly preload backend config before rendering
initAppConfig().catch(() => {
  console.warn('App config preload failed, will retry on component mount');
});

createRoot(document.getElementById("root")!).render(<App />);
