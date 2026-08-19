import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PUBLIC_ROUTES } from "../../routes/routes";
import { getCompanyInfo } from "../../services/empresaService";
import "./HomeFooter.css";

function HomeFooter() {
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getCompanyInfo()
      .then((info) => {
        if (isMounted) {
          setCompanyInfo(info);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCompanyInfo(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="footer home-footer">
      <div className="home-footer-top">
        <div>
          <span>Identidad local</span>
          <h2>Desde San Miguel Oeste de Naranjo</h2>
        </div>
        <p>
          La marca se presenta como una experiencia cercana y confiable: seleccion
          botanica, asesoria de cuidado, preparacion de regalos y entrega local con
          una estetica de calidad.
        </p>
      </div>

      <div className="footer-container">
        <div>
          <h3>Concre Innova</h3>
          <p>Diseno ecologico para espacios modernos</p>
        </div>

        <div>
          <h4>Contacto</h4>
          {companyInfo?.correo && (
            <p>
              <a href={`mailto:${companyInfo.correo}`}>{companyInfo.correo}</a>
            </p>
          )}
          {companyInfo?.telefono && (
            <p>
              <a href={`tel:${companyInfo.telefono.replace(/\s/g, "")}`}>
                {companyInfo.telefono}
              </a>
            </p>
          )}
          <p>
            <Link to={PUBLIC_ROUTES.CONTACT}>Enviar una consulta</Link>
          </p>
        </div>

        <div>
          <h4>Redes</h4>
          {companyInfo?.instagram && (
            <p>
              <a href={companyInfo.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </p>
          )}
          {companyInfo?.facebook && (
            <p>
              <a href={companyInfo.facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            </p>
          )}
          {companyInfo?.tikTok && (
            <p>
              <a href={companyInfo.tikTok} target="_blank" rel="noreferrer">
                TikTok
              </a>
            </p>
          )}
        </div>
      </div>

      <p className="footer-copy">2026 Concre Innova - Todos los derechos reservados</p>
    </footer>
  );
}

export default HomeFooter;
