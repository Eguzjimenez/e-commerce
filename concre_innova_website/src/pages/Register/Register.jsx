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

    const normalizedValue = name === "telefono"
      ? value.replace(/\D/g, "")
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.correo.trim())) {
      await Swal.fire({
        icon: "warning",
        title: "Correo invalido",
        text: "Ingresa un correo electronico valido.",
      });
      return;
    }

    if (!/^\d+$/.test(formData.telefono) || formData.telefono.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Telefono invalido",
        text: "El telefono solo puede contener numeros.",
      });
      return;
    }

    if (formData.contrasena.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "Contrasena invalida",
        text: "La contrasena debe tener al menos 8 caracteres.",
      });
      return;
    }

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

        <div className="auth-heading">
          <span>Cliente</span>
          <h1>Crear cuenta</h1>
          <p>Registra tus datos para comprar y guardar informacion de contacto.</p>
        </div>

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
            inputMode="email"
            required
          />
          <input
            className="register-input"
            name="telefono"
            placeholder="Telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            inputMode="numeric"
            pattern="[0-9]+"
            required
          />
          <input
            className="register-input"
            name="contrasena"
            type="password"
            placeholder="Contrasena"
            value={formData.contrasena}
            onChange={handleChange}
            minLength="8"
            required
          />
          <input
            className="register-input"
            name="confirmarContrasena"
            type="password"
            placeholder="Confirmar contrasena"
            value={formData.confirmarContrasena}
            onChange={handleChange}
            minLength="8"
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
