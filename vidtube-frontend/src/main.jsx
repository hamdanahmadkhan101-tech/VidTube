import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { useAuthStore } from './store/index.js';

// Initialize auth state on app load
function AppWithInitialization() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithInitialization />
  </StrictMode>
);
