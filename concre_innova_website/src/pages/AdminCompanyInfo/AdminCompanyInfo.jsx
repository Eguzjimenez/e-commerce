import "./AdminCompanyInfo.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  getCompanyInfo,
  getContactMessages,
  updateCompanyInfo,
} from "../../services/empresaService";

const EMPTY_INFO = {
  nombreEmpresa: "",
  descripcion: "",
  correo: "",
  telefono: "",
  whatsApp: "",
  direccion: "",
  horario: "",
  facebook: "",
  instagram: "",
  tikTok: "",
};

function AdminCompanyInfo() {
  const [info, setInfo] = useState(EMPTY_INFO);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [infoResponse, mensajesResponse] = await Promise.all([
        getCompanyInfo(),
        getContactMessages({ pagina: 1, tamanoPagina: 20 }),
      ]);

      setInfo({ ...EMPTY_INFO, ...infoResponse });
      setMensajes(Array.isArray(mensajesResponse?.items) ? mensajesResponse.items : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la información de la empresa.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInfo((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await updateCompanyInfo(info);

      if (result?.codigo !== 1) {
        throw new Error(result?.mensaje || "No se pudo actualizar la información.");
      }

      await Swal.fire({
        icon: "success",
        title: "Información actualizada",
        text: "Los datos de la empresa se guardaron correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      await loadData();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: saveError.message || "Revisa los datos e intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Información de la empresa"
      subtitle="Datos de contacto y presentación que ve el público.">
      <div className="admin-company-page">
        {error && <div className="admin-products-error">{error}</div>}
        {loading && <div className="admin-products-empty">Cargando información...</div>}

        {!loading && (
          <>
            <section className="admin-company-card">
              <header>
                <h2>Datos publicos</h2>
                <p>Esta información se muestra en la página de contacto y en el pie del sitio.</p>
              </header>

              <form className="admin-company-form" onSubmit={handleSubmit}>
                <label>
                  Nombre de la empresa
                  <input
                    type="text"
                    name="nombreEmpresa"
                    value={info.nombreEmpresa}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                </label>

                <label className="admin-company-full">
                  Descripción
                  <textarea
                    name="descripcion"
                    value={info.descripcion}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1000}
                  />
                </label>

                <label>
                  Correo de contacto
                  <input
                    type="email"
                    name="correo"
                    value={info.correo}
                    onChange={handleChange}
                    maxLength={150}
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="text"
                    name="telefono"
                    value={info.telefono}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </label>

                <label>
                  WhatsApp
                  <input
                    type="text"
                    name="whatsApp"
                    value={info.whatsApp}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </label>

                <label>
                  Horario de atención
                  <input
                    type="text"
                    name="horario"
                    value={info.horario}
                    onChange={handleChange}
                    maxLength={255}
                  />
                </label>

                <label className="admin-company-full">
                  Dirección
                  <input
                    type="text"
                    name="direccion"
                    value={info.direccion}
                    onChange={handleChange}
                    maxLength={255}
                  />
                </label>

                <label>
                  Facebook
                  <input
                    type="url"
                    name="facebook"
                    value={info.facebook}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="https://www.facebook.com/tu-página"
                  />
                </label>

                <label>
                  Instagram
                  <input
                    type="url"
                    name="instagram"
                    value={info.instagram}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="https://www.instagram.com/tu-cuenta"
                  />
                </label>

                <label>
                  TikTok
                  <input
                    type="url"
                    name="tikTok"
                    value={info.tikTok}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="https://www.tiktok.com/@tu-cuenta"
                  />
                </label>

                <div className="admin-company-actions">
                  <button type="submit" className="admin-primary-button" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-company-card">
              <header>
                <h2>Consultas recibidas</h2>
                <p>Mensajes enviados desde el formulario de contacto.</p>
              </header>

              <div className="admin-table-wrapper">
                <table className="admin-company-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Asunto</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mensajes.map((mensaje) => (
                      <tr key={mensaje.idMensaje}>
                        <td>{new Date(mensaje.fechaEnvio).toLocaleDateString("es-CR")}</td>
                        <td>{mensaje.nombre}</td>
                        <td>
                          <a href={`mailto:${mensaje.correo}`}>{mensaje.correo}</a>
                        </td>
                        <td>{mensaje.asunto}</td>
                        <td className="admin-company-message">{mensaje.mensaje}</td>
                      </tr>
                    ))}

                    {mensajes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="admin-empty-row">
                          Todavia no hay consultas recibidas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminCompanyInfo;
