import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { getUserId } from "../../services/authService";
import { getUserInfo, updateUserInfo } from "../../services/userService";
import "./MyAccount.css";

function MyAccount() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: "",
    contrasena: "",
  });

  const userId = useMemo(() => Number(getUserId()), []);

  const loadUserProfile = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("No se pudo identificar al usuario de la sesion.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getUserInfo(userId);
      setProfile(response);
      setForm({
        nombre: String(response?.nombre || ""),
        apellido: String(response?.apellido || ""),
        correo: String(response?.correo || ""),
        telefono: String(response?.telefono || ""),
        direccion: String(response?.direccion || ""),
        contrasena: "",
      });
    } catch (loadError) {
      setError(loadError?.message || "No se pudo cargar la informacion de la cuenta.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        idUsuario: userId,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        contrasena: form.contrasena.trim(),
      };

      const response = await updateUserInfo(payload);

      if (Number(response?.codigo) !== 1) {
        throw new Error(response?.mensaje || "No se pudo actualizar la informacion.");
      }

      await Swal.fire({
        icon: "success",
        title: "Informacion actualizada",
        text: response?.mensaje || "Los cambios se guardaron correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      await loadUserProfile();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: saveError?.message || "Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-account-page container">
      <header className="my-account-header">
        <h1 className="my-account-title">
          <span className="my-account-title-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-4.42 0-8 2.24-8 5v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          </span>
          Mi cuenta
        </h1>
        <p>Consulta y actualiza la informacion de tu cuenta de cliente.</p>
      </header>

      {loading && <div className="my-account-status">Cargando informacion...</div>}

      {!loading && error && <div className="my-account-error">{error}</div>}

      {!loading && !error && profile && (
        <div className="my-account-layout">
          <section className="my-account-form card">
            <form onSubmit={handleSubmit}>
              <div className="my-account-grid-3x2">
                <label>
                  <span>Nombre</span>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  <span>Apellido</span>
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  <span>Correo</span>
                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  <span>Telefono</span>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  <span>Direccion</span>
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  <span>Nueva contrasena</span>
                  <input
                    type="password"
                    name="contrasena"
                    value={form.contrasena}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <button className="btn my-account-submit" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default MyAccount;
