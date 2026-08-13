import "./Contact.css";
import { useEffect, useState } from "react";
import { Clock, ExternalLink, Mail, MapPin, Phone, Send } from "lucide-react";
import Swal from "sweetalert2";
import { getCompanyInfo, sendContactMessage } from "../../services/empresaService";
import { getAuth } from "../../services/authService";

const EMPTY_FORM = {
  nombre: "",
  correo: "",
  telefono: "",
  asunto: "",
  mensaje: "",
};

function buildWhatsAppLink(numero) {
  const digits = String(numero || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function Contact() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCompanyInfo();
      setEmpresa(response);

      const auth = getAuth();
      if (auth?.correo) {
        setForm((previous) => ({ ...previous, correo: auth.correo }));
      }
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la informacion de contacto.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);

    try {
      const result = await sendContactMessage(form);

      if (result?.codigo !== 1) {
        throw new Error(result?.mensaje || "No se pudo enviar el mensaje.");
      }

      setForm(EMPTY_FORM);

      await Swal.fire({
        icon: "success",
        title: "Mensaje enviado",
        text: "Gracias por escribirnos. Te responderemos lo antes posible.",
      });
    } catch (sendError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo enviar",
        text: sendError.message || "Revisa los datos e intenta nuevamente.",
      });
    } finally {
      setSending(false);
    }
  };

  const whatsAppLink = buildWhatsAppLink(empresa?.whatsApp);

  return (
    <main className="contact-page">
      <header className="contact-header">
        <span>Contacto</span>
        <h1>Hablemos de tu espacio</h1>
        <p>
          Escribinos para cotizaciones, asesoria de cuidado o cualquier consulta sobre
          nuestros productos.
        </p>
      </header>

      {loading && <p className="contact-state">Cargando informacion...</p>}
      {!loading && error && <p className="contact-state error">{error}</p>}

      {!loading && empresa && (
        <div className="contact-layout">
          <section className="contact-info">
            <h2>{empresa.nombreEmpresa}</h2>
            <p className="contact-description">{empresa.descripcion}</p>

            <ul className="contact-list">
              {empresa.correo && (
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <div>
                    <span>Correo</span>
                    <a href={`mailto:${empresa.correo}`}>{empresa.correo}</a>
                  </div>
                </li>
              )}

              {empresa.telefono && (
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <div>
                    <span>Telefono</span>
                    <a href={`tel:${empresa.telefono.replace(/\s/g, "")}`}>{empresa.telefono}</a>
                  </div>
                </li>
              )}

              {whatsAppLink && (
                <li>
                  <Send size={18} aria-hidden="true" />
                  <div>
                    <span>WhatsApp</span>
                    <a href={whatsAppLink} target="_blank" rel="noreferrer">
                      {empresa.whatsApp}
                    </a>
                  </div>
                </li>
              )}

              {empresa.direccion && (
                <li>
                  <MapPin size={18} aria-hidden="true" />
                  <div>
                    <span>Direccion</span>
                    <p>{empresa.direccion}</p>
                  </div>
                </li>
              )}

              {empresa.horario && (
                <li>
                  <Clock size={18} aria-hidden="true" />
                  <div>
                    <span>Horario</span>
                    <p>{empresa.horario}</p>
                  </div>
                </li>
              )}
            </ul>

            <div className="contact-social">
              <span>Seguinos</span>
              <div>
                {empresa.facebook && (
                  <a href={empresa.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <ExternalLink size={18} aria-hidden="true" />
                    Facebook
                  </a>
                )}
                {empresa.instagram && (
                  <a href={empresa.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <ExternalLink size={18} aria-hidden="true" />
                    Instagram
                  </a>
                )}
                {empresa.tikTok && (
                  <a href={empresa.tikTok} target="_blank" rel="noreferrer" aria-label="TikTok">
                    <ExternalLink size={18} aria-hidden="true" />
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="contact-form-card">
            <h2>Enviar una consulta</h2>
            <p>Completa el formulario y te contactamos por correo.</p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  disabled={sending}
                />
              </label>

              <label>
                Correo electronico
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  disabled={sending}
                />
              </label>

              <label>
                Telefono (opcional)
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  maxLength={50}
                  disabled={sending}
                />
              </label>

              <label>
                Asunto
                <input
                  type="text"
                  name="asunto"
                  value={form.asunto}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  disabled={sending}
                />
              </label>

              <label>
                Mensaje
                <textarea
                  name="mensaje"
                  value={form.mensaje}
                  onChange={handleChange}
                  rows={5}
                  maxLength={2000}
                  required
                  disabled={sending}
                />
              </label>

              <button type="submit" className="contact-submit" disabled={sending}>
                <Send size={18} aria-hidden="true" />
                {sending ? "Enviando..." : "Enviar consulta"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Contact;
