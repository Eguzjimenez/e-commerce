import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import AppRoutes from "./routes/AppRoutes";
import ChatBot from "./pages/Chat/Chat";
import { verifyStoredRecoveryToken } from "./services/authService";

function App() {
  useEffect(() => {
    verifyStoredRecoveryToken();
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