import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAppConfig } from "./lib/appConfig";
import { initializeAppKit } from "./lib/web3modal-config";

async function bootstrap() {
  try {
    await initAppConfig();
  } catch {
    console.warn('App config preload failed, continuing with fallback chain metadata');
  }

  initializeAppKit();
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
