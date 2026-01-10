import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { useAuthStore } from "./store/index.js";

// Initialize auth state on app load
function AppWithInitialization() {
  const initialize = useAuthStore((state) => state.initialize);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return <App />;
}

createRoot(document.getElementById("root")).render(<AppWithInitialization />);
