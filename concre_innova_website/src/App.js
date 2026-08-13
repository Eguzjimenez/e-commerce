import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import AppRoutes from "./routes/AppRoutes";
import ChatBot from "./pages/Chat/Chat";
import { verifyStoredRecoveryToken } from "./services/authService";
import { getStoredTheme } from "./services/preferencesService";

function App() {
  useEffect(() => {
    verifyStoredRecoveryToken();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = getStoredTheme();
    };

    applyTheme();

    window.addEventListener("temachange", applyTheme);
    window.addEventListener("storage", applyTheme);

    return () => {
      window.removeEventListener("temachange", applyTheme);
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <AppRoutes />
      <ChatBot />
    </Router>
  );
}

export default App;
