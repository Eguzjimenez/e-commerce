import "./Login.css";

import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        <div className="login-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        <input className="login-input" placeholder="Correo" />
        <input className="login-input" type="password" placeholder="Contraseña" />

        <button className="login-btn">Entrar</button>

        <div className="login-links">
          <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          <Link to="/register">Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;