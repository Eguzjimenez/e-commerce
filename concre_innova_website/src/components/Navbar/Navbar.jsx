import { Link } from "react-router-dom";
import { useState } from "react";
import { PUBLIC_ROUTES } from "../../routes/routes";

import { PRIVATE_ROUTES } from "../../routes/routes";


function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        {/* LOGO */}
        <Link to={PUBLIC_ROUTES.HOME} className="nav-logo">
          🌿 Concre Innova
        </Link>

        {/* BOTÓN HAMBURGUESA */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* MENÚ */}
        <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
          <li>
            <Link to={PUBLIC_ROUTES.HOME}>Inicio</Link>
          </li>
          <li>
            <Link to={PUBLIC_ROUTES.CATALOG}>Catálogo</Link>
          </li>
          <li>
            <Link to={PRIVATE_ROUTES.CART}>Carrito</Link>
          </li>
          <li>
            <Link to={PUBLIC_ROUTES.LOGIN}>Login</Link>
          </li>
          <li>
            <Link to={PUBLIC_ROUTES.CHAT}>Chat</Link>
          </li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;