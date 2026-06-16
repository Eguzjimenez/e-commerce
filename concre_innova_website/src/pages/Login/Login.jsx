import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { login as loginUser } from "../../services/authService";
import { ADMIN_ROUTES } from "../../routes/routes";
import "./Login.css";
import { registerBitacora } from "../../services/bitacoraService";
import { isStaffRole } from "../../constants/roleAccess";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await loginUser({ correo, contrasena });
      if (auth.codigo === 1) {
        await registerBitacora({
          idUsuario:     auth.idUsuario,
          tablaAfectada: "Usuarios",
          operacion:     "LOGIN",
          descripcion:   `Inicio de sesión exitoso: ${auth.correo}`,
        });

        await Swal.fire({
            icon: "success",
            title: "Bienvenido",
            text: auth.mensaje || "Inicio de sesión exitoso.",
            timer: 1800,
            showConfirmButton: false,
        });

      }

      if (auth.codigo === 0) {
        const msg = auth.mensaje || "No se pudo iniciar sesión.";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: msg,
        });
        return;
      }

      const requestedPath = location.state?.from?.pathname;

      if (isStaffRole(auth.nombreRol)) {
        navigate(requestedPath?.startsWith("/admin") ? requestedPath : ADMIN_ROUTES.DASHBOARD);
      } else if (requestedPath && !requestedPath.startsWith("/admin")) {
        navigate(requestedPath);
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err?.message || "Error al iniciar sesión. Verifica tus datos.";
      setError(message);
      Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        <div className="login-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            placeholder="Correo"
            type="email"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(event) => setContrasena(event.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
