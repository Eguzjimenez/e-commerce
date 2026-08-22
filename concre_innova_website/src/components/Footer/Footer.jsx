import "./Footer.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Mail, Music2, Phone, Users } from "lucide-react";
import { getCompanyInfo } from "../../services/empresaService";
import { PUBLIC_ROUTES } from "../../routes/routes";

const ANIO_ACTUAL = new Date().getFullYear();

/**
 * Pie de página único de la aplicación. Se monta una sola vez en App para que
 * todas las vistas compartan la misma estructura, diseño y contenido.
 */
function Footer() {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    let vigente = true;

    getCompanyInfo()
      .then((informacion) => {
        if (vigente) {
          setEmpresa(informacion);
        }
      })
      .catch(() => {
        // El pie de página se muestra igual con los datos institucionales fijos.
      });

    return () => {
      vigente = false;
    };
  }, []);

  const telefonoEnlace = empresa?.telefono
    ? empresa.telefono.replace(/[^\d+]/g, "")
    : null;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-footer-eyebrow">Identidad local</span>
          <h2>Concre Innova</h2>
          <p>
            Diseño ecológico para espacios modernos. Maceteros de concreto
            fabricados en San Miguel Oeste de Naranjo, Alajuela.
          </p>
        </div>

        <nav className="site-footer-column" aria-label="Navegación del pie de página">
          <h3>Explorar</h3>
          <Link to={PUBLIC_ROUTES.HOME}>Inicio</Link>
          <Link to={PUBLIC_ROUTES.CATALOG}>Catálogo</Link>
          <Link to={PUBLIC_ROUTES.FAVORITES}>Favoritos</Link>
        </nav>

        <div className="site-footer-column">
          <h3>Contacto</h3>
          {empresa?.correo && (
            <a href={`mailto:${empresa.correo}`}>
              <Mail className="site-footer-link-icon" size={17} aria-hidden="true" />
              {empresa.correo}
            </a>
          )}
          {empresa?.telefono && (
            <a href={`tel:${telefonoEnlace}`}>
              <Phone className="site-footer-link-icon" size={17} aria-hidden="true" />
              {empresa.telefono}
            </a>
          )}
          {empresa?.direccion && <p>{empresa.direccion}</p>}
          {empresa?.horario && <p className="site-footer-note">{empresa.horario}</p>}
          <Link to={PUBLIC_ROUTES.CONTACT}>Enviar una consulta</Link>
        </div>

        <div className="site-footer-column">
          <h3>Redes</h3>
          {empresa?.instagram && (
            <a href={empresa.instagram} target="_blank" rel="noreferrer">
              <Camera className="site-footer-link-icon" size={17} aria-hidden="true" />
              Instagram
            </a>
          )}
          {empresa?.facebook && (
            <a href={empresa.facebook} target="_blank" rel="noreferrer">
              <Users className="site-footer-link-icon" size={17} aria-hidden="true" />
              Facebook
            </a>
          )}
          {empresa?.tikTok && (
            <a href={empresa.tikTok} target="_blank" rel="noreferrer">
              <Music2 className="site-footer-link-icon" size={17} aria-hidden="true" />
              TikTok
            </a>
          )}
        </div>
      </div>

      <div className="site-footer-legal">
        <p>© {ANIO_ACTUAL} Concre Innova. Todos los derechos reservados.</p>
        <p>Precios en colones costarricenses con impuesto incluido.</p>
      </div>
    </footer>
  );
}

export default Footer;
