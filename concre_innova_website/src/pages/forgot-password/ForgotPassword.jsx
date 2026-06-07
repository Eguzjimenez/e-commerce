import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import Swal from "sweetalert2";
import { validateEmail, resetPassword } from "../../services/authService";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [idUsuario, setIdUsuario] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const navigate = useNavigate();

  const handleValidateEmail = async (e) => {
    e.preventDefault();
    try {
      const data = await validateEmail(email);
      if (data?.codigo === 1 && data?.idUsuario) {
        setIdUsuario(data.idUsuario);
        setStep(2);
      } else {
        await Swal.fire({ icon: "warning", title: "Correo", text: data?.mensaje || "Correo no encontrado" });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error validando correo" });
    }
  };

  const handlePasswordChange = async (e) => {
    e?.preventDefault();
    if (!password || password !== passwordConfirm) {
      await Swal.fire({ icon: "warning", title: "Contraseñas", text: "Las contraseñas no coinciden" });
      return;
    }

    if (password.length < 8) {
      await Swal.fire({ icon: "warning", title: "Contraseña débil", text: "La contraseña debe tener mínimo 8 caracteres" });
      return;
    }

    try {
      const res = await resetPassword({ idUsuario, nuevaContrasena: password });
      if (res?.codigo === 1) {
        await Swal.fire({ icon: "success", title: "Éxito", text: res.mensaje || "Contraseña actualizada correctamente" });
        navigate("/login");
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: res?.mensaje || "No se pudo actualizar la contraseña" });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error actualizando la contraseña" });
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">

        <div className="forgot-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleValidateEmail} noValidate>
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
              Validar correo
            </button>
          </form>
        )}

        
        {step === 2 && (
          <form className="forgot-form" onSubmit={handlePasswordChange}>
            <h2>Nueva contraseña</h2>

            <input
              className="forgot-input"
              type="password"
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              required
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="forgot-input"
              type="password"
              placeholder="Confirmar contraseña"
              required
              minLength="8"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />

            <button className="forgot-btn" type="submit">
              Cambiar contraseña
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;