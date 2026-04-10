import "./Register.css";

import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="register-wrapper">
      <div className="register-card">

        {/* LOGO */}
        <div className="register-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        <h2>Crear Cuenta</h2>

        <input className="register-input" placeholder="Nombre completo" />
        <input className="register-input" placeholder="Correo" />
        <input className="register-input" type="password" placeholder="Contraseña" />
        <input className="register-input" type="password" placeholder="Confirmar contraseña" />

        <button className="register-btn">Registrarse</button>

        <div className="register-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;