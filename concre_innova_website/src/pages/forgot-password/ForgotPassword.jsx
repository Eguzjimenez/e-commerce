import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import Swal from "sweetalert2";
import {
  requestPasswordResetCode,
  resetPassword,
  verifyRecoveryCode,
} from "../../services/authService";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const navigate = useNavigate();

  const handleValidateEmail = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    try {
      const data = await requestPasswordResetCode(normalizedEmail);
      if (data?.codigo === 1) {
        setEmail(normalizedEmail);
        setVerificationCode("");
        setRecoveryToken("");
        setStep(2);
        await Swal.fire({
          icon: "success",
          title: "Codigo enviado",
          text: data?.mensaje || "Revisa tu correo para continuar.",
        });
      } else {
        await Swal.fire({ icon: "warning", title: "Correo", text: data?.mensaje || "Correo no encontrado" });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error validando correo" });
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    try {
      const data = await verifyRecoveryCode({
        correo: email,
        codigo: verificationCode,
      });

      if (data?.codigo === 1 && data?.recoveryToken) {
        setRecoveryToken(data.recoveryToken);
        setPassword("");
        setPasswordConfirm("");
        setStep(3);
        await Swal.fire({
          icon: "success",
          title: "Codigo verificado",
          text: data?.mensaje || "Ahora puedes crear una nueva contrasena.",
        });
      } else {
        await Swal.fire({ icon: "warning", title: "Codigo", text: data?.mensaje || "Codigo no valido" });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error validando codigo" });
    }
  };

  const handlePasswordChange = async (e) => {
    e?.preventDefault();
    if (!password || password !== passwordConfirm) {
      await Swal.fire({ icon: "warning", title: "Contrasenas", text: "Las contrasenas no coinciden" });
      return;
    }

    if (password.length < 8) {
      await Swal.fire({ icon: "warning", title: "Contrasena debil", text: "La contrasena debe tener minimo 8 caracteres" });
      return;
    }

    try {
      const res = await resetPassword({ recoveryToken, nuevaContrasena: password });
      if (res?.codigo === 1) {
        await Swal.fire({ icon: "success", title: "Exito", text: res.mensaje || "Contrasena actualizada correctamente" });
        navigate("/login");
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: res?.mensaje || "No se pudo actualizar la contrasena" });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error actualizando la contrasena" });
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <div className="forgot-logo">
          <span className="logo-icon">CI</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        {step === 1 && (
          <form className="forgot-form" onSubmit={handleValidateEmail} noValidate>
            <div className="auth-heading">
              <span>Recuperacion</span>
              <h1>Recuperar contrasena</h1>
              <p>Ingresa tu correo para enviarte un codigo de verificacion.</p>
            </div>

            <input
              className="forgot-input"
              placeholder="Correo"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="forgot-btn">
              Enviar codigo
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-form" onSubmit={handleVerifyCode}>
            <div className="auth-heading">
              <span>Verificacion</span>
              <h1>Codigo de seguridad</h1>
              <p>Ingresa el codigo de 6 digitos enviado a {email}.</p>
            </div>

            <input
              className="forgot-input"
              type="text"
              placeholder="Codigo de verificacion"
              required
              maxLength="6"
              inputMode="numeric"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />

            <button className="forgot-btn" type="submit">
              Verificar codigo
            </button>

            <button className="forgot-link-button" type="button" onClick={handleValidateEmail}>
              Reenviar codigo
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="forgot-form" onSubmit={handlePasswordChange}>
            <div className="auth-heading">
              <span>Seguridad</span>
              <h1>Nueva contrasena</h1>
              <p>Usa una clave de minimo 8 caracteres.</p>
            </div>

            <input
              className="forgot-input"
              type="password"
              placeholder="Nueva contrasena (min. 8 caracteres)"
              required
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="forgot-input"
              type="password"
              placeholder="Confirmar contrasena"
              required
              minLength="8"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />

            <button className="forgot-btn" type="submit">
              Cambiar contrasena
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
