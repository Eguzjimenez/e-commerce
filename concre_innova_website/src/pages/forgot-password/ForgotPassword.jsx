import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSendCode = (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.checkValidity()) {
      setStep(2);
    }
  };

  const handlePasswordChange = () => {
    alert("Contraseña cambiada!");
    navigate("/login");
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">

        <div className="forgot-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleSendCode} noValidate>
            <h2>Recuperar contraseña</h2>
            <p>Ingresa tu correo</p>

            <input
              className="forgot-input"
              placeholder="Correo"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="forgot-btn">
              Enviar código
            </button>
          </form>
        )}

        
        {step === 2 && (
          <>
            <h2>Verificación</h2>
            <p>Ingresa el código enviado</p>
            <p className="timer">Código válido por 2:00</p>
            <input className="forgot-input" placeholder="Código" />

            <button className="forgot-btn" onClick={() => setStep(3)}>
              Validar código
            </button>
          </>
        )}

        
        {step === 3 && (
          <>
            <h2>Nueva contraseña</h2>

            <input className="forgot-input" type="password" placeholder="Nueva contraseña" />
            <input className="forgot-input" type="password" placeholder="Confirmar contraseña" />

            <button className="forgot-btn" onClick={handlePasswordChange}>
              Cambiar contraseña
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;