import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { registerClient } from "../../services/authService";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.contrasena !== formData.confirmarContrasena) {
      await Swal.fire({
        icon: "warning",
        title: "Contrasenas distintas",
        text: "La confirmacion debe coincidir con la contrasena.",
      });
      return;
    }

    setLoading(true);

    try {
      await registerClient({
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        contrasena: formData.contrasena,
      });

      await Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: "Tu cuenta de cliente fue registrada correctamente.",
      });

      navigate("/login");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: error.message || "Verifica los datos ingresados.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-logo">
          <span className="logo-icon">CI</span>
          <span className="logo-text">Concre Innova</span>
        </div>

        <h2>Crear Cuenta</h2>

        <form className="register-form" onSubmit={handleSubmit}>
          <input
            className="register-input"
            name="nombre"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <input
            className="register-input"
            name="correo"
            placeholder="Correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            required
          />
          <input
            className="register-input"
            name="telefono"
            placeholder="Telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
          <input
            className="register-input"
            name="contrasena"
            type="password"
            placeholder="Contrasena"
            value={formData.contrasena}
            onChange={handleChange}
            minLength="6"
            required
          />
          <input
            className="register-input"
            name="confirmarContrasena"
            type="password"
            placeholder="Confirmar contrasena"
            value={formData.confirmarContrasena}
            onChange={handleChange}
            minLength="6"
            required
          />

          <button className="register-btn" type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="register-links">
          <Link to="/login">Ya tienes cuenta? Inicia sesion</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
