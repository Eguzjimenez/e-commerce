import "./Contact.css";
import { useEffect, useState } from "react";
import { Camera, Clock, Mail, MapPin, Music2, Phone, Send, Users } from "lucide-react";
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
      setError(loadError.message || "No se pudo cargar la información de contacto.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "nombre") {
      nextValue = value.replace(/[^\p{L}\s]/gu, "");
    }

    if (name === "telefono") {
      nextValue = value.replace(/\D/g, "").slice(0, 15);
    }

    setForm((previous) => ({ ...previous, [name]: nextValue }));
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
        text: sendError.message || "Revisa los datos e inténtalo nuevamente.",
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
          Escríbenos para cotizaciones, asesoría de cuidado o cualquier consulta sobre
          nuestros productos.
        </p>
      </header>

      {loading && <p className="contact-state">Cargando información...</p>}
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
                    <span>Teléfono</span>
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
                    <span>Dirección</span>
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
              <span>Síguenos</span>
              <div>
                {empresa.facebook && (
                  <a href={empresa.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <Users size={18} aria-hidden="true" />
                    Facebook
                  </a>
                )}
                {empresa.instagram && (
                  <a href={empresa.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Camera size={18} aria-hidden="true" />
                    Instagram
                  </a>
                )}
                {empresa.tikTok && (
                  <a href={empresa.tikTok} target="_blank" rel="noreferrer" aria-label="TikTok">
                    <Music2 size={18} aria-hidden="true" />
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="contact-form-card">
            <h2>Enviar una consulta</h2>
            <p>Completa el formulario y nos pondremos en contacto contigo por correo.</p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input
                  type="text"
                  name="nombre"
                  autoComplete="name"
                  pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+"
                  title="Ingresa solo letras y espacios."
                  value={form.nombre}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  disabled={sending}
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  name="correo"
                  autoComplete="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Ingresa un correo electrónico válido."
                  value={form.correo}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  disabled={sending}
                />
              </label>

              <label>
                Teléfono (opcional)
                <input
                  type="tel"
                  name="telefono"
                  inputMode="numeric"
                  pattern="[0-9]{8,15}"
                  title="Ingresa entre 8 y 15 dígitos. Este campo es opcional."
                  placeholder="88888888"
                  value={form.telefono}
                  onChange={handleChange}
                  maxLength={20}
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
