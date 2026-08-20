import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { registerClient } from "../../services/authService";
import { getPasswordPolicyMessage } from "../../services/passwordPolicyService";
import "./Register.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_TELEFONO = 8;
const MAX_TELEFONO = 15;
const MIN_DIRECCION = 10;
const MAX_DIRECCION = 255;

const CAMPOS_INICIALES = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  direccion: "",
  contrasena: "",
  confirmarContrasena: "",
};

/** Reglas de cada campo en un solo lugar, para no repetir validaciones. */
function validarCampo(nombreCampo, valores) {
  const valor = (valores[nombreCampo] ?? "").trim();

  switch (nombreCampo) {
    case "nombre":
      return valor.length >= 2 ? "" : "Escribe tu nombre.";
    case "apellido":
      return valor.length >= 2 ? "" : "Escribe tus apellidos.";
    case "correo":
      return EMAIL_PATTERN.test(valor) ? "" : "Ingresa un correo electrónico válido.";
    case "telefono":
      return valor.length >= MIN_TELEFONO && valor.length <= MAX_TELEFONO
        ? ""
        : `El teléfono debe tener entre ${MIN_TELEFONO} y ${MAX_TELEFONO} dígitos.`;
    case "direccion":
      if (valor.length < MIN_DIRECCION) {
        return "Indica provincia, cantón y señas para la entrega.";
      }
      return valor.length <= MAX_DIRECCION
        ? ""
        : `La dirección no puede superar ${MAX_DIRECCION} caracteres.`;
    case "contrasena":
      return getPasswordPolicyMessage(valores.contrasena) || "";
    case "confirmarContrasena":
      return valores.contrasena === valores.confirmarContrasena
        ? ""
        : "La confirmación debe coincidir con la contraseña.";
    default:
      return "";
  }
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [loading, setLoading] = useState(false);

  const requisitoContrasena = useMemo(
    () => getPasswordPolicyMessage(formData.contrasena) || "",
    [formData.contrasena]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    const valorNormalizado =
      name === "telefono" ? value.replace(/\D/g, "").slice(0, MAX_TELEFONO) : value;

    const siguiente = { ...formData, [name]: valorNormalizado };
    setFormData(siguiente);

    setErrores((previos) => {
      const actualizados = { ...previos };

      if (tocados[name]) {
        actualizados[name] = validarCampo(name, siguiente);
      }

      // La confirmación depende de la contraseña, así que se revalida junto a ella.
      if (name === "contrasena" && tocados.confirmarContrasena) {
        actualizados.confirmarContrasena = validarCampo("confirmarContrasena", siguiente);
      }

      return actualizados;
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTocados((prev) => ({ ...prev, [name]: true }));
    setErrores((prev) => ({ ...prev, [name]: validarCampo(name, formData) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    const todosTocados = {};

    Object.keys(CAMPOS_INICIALES).forEach((campo) => {
      todosTocados[campo] = true;
      const mensaje = validarCampo(campo, formData);
      if (mensaje) {
        nuevosErrores[campo] = mensaje;
      }
    });

    setTocados(todosTocados);
    setErrores(nuevosErrores);

    const camposConError = Object.keys(nuevosErrores);

    if (camposConError.length > 0) {
      document.getElementById(`registro-${camposConError[0]}`)?.focus();
      await Swal.fire({
        icon: "warning",
        title: "Revisa los datos",
        text: nuevosErrores[camposConError[0]],
      });
      return;
    }

    setLoading(true);

    try {
      await registerClient({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
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

  const renderCampo = ({
    name,
    label,
    ayuda,
    type = "text",
    autoComplete,
    inputMode,
    placeholder,
    multilinea = false,
    ancho = "",
  }) => {
    const id = `registro-${name}`;
    const idAyuda = `${id}-ayuda`;
    const error = tocados[name] ? errores[name] : "";
    const Control = multilinea ? "textarea" : "input";

    return (
      <div className={`register-field ${ancho}`.trim()}>
        <label className="register-label" htmlFor={id}>
          {label}
        </label>
        <Control
          className={`register-input ${error ? "is-invalid" : ""}`.trim()}
          id={id}
          name={name}
          type={multilinea ? undefined : type}
          rows={multilinea ? 3 : undefined}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-describedby={error || ayuda ? idAyuda : undefined}
          aria-invalid={error ? "true" : undefined}
          required
        />
        {(error || ayuda) && (
          <p className={`register-help ${error ? "is-error" : ""}`.trim()} id={idAyuda}>
            {error || ayuda}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <header className="register-header">
          <div className="register-logo">
            <span className="logo-icon">CI</span>
            <span className="logo-text">Concre Innova</span>
          </div>
          <span className="register-tag">Cuenta de cliente</span>
          <h1>Crear cuenta</h1>
          <p>
            Con estos datos preparamos tus pedidos y usamos tu dirección como entrega
            predeterminada.
          </p>
        </header>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="register-section">
            <legend>Datos personales</legend>
            <div className="register-grid">
              {renderCampo({
                name: "nombre",
                label: "Nombre",
                autoComplete: "given-name",
                placeholder: "María",
              })}
              {renderCampo({
                name: "apellido",
                label: "Apellidos",
                autoComplete: "family-name",
                placeholder: "Rodríguez Solís",
              })}
            </div>
          </fieldset>

          <fieldset className="register-section">
            <legend>Contacto y entrega</legend>
            <div className="register-grid">
              {renderCampo({
                name: "correo",
                label: "Correo electrónico",
                type: "email",
                autoComplete: "email",
                inputMode: "email",
                placeholder: "nombre@correo.com",
              })}
              {renderCampo({
                name: "telefono",
                label: "Teléfono",
                type: "tel",
                autoComplete: "tel",
                inputMode: "numeric",
                placeholder: "88888888",
                ayuda: "Solo números, entre 8 y 15 dígitos.",
              })}
              {renderCampo({
                name: "direccion",
                label: "Dirección de entrega",
                autoComplete: "street-address",
                placeholder: "Provincia, cantón, distrito y señas exactas",
                ayuda: `Se usará al finalizar tus compras. Máximo ${MAX_DIRECCION} caracteres.`,
                multilinea: true,
                ancho: "register-field-full",
              })}
            </div>
          </fieldset>

          <fieldset className="register-section">
            <legend>Seguridad</legend>
            <div className="register-grid">
              {renderCampo({
                name: "contrasena",
                label: "Contraseña",
                type: "password",
                autoComplete: "new-password",
                ayuda: requisitoContrasena || "Cumple con los requisitos de seguridad.",
              })}
              {renderCampo({
                name: "confirmarContrasena",
                label: "Confirmar contraseña",
                type: "password",
                autoComplete: "new-password",
              })}
            </div>
          </fieldset>

          <button className="register-btn" type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Crear mi cuenta"}
          </button>
        </form>

        <div className="register-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
