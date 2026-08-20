import "./AdminLayout.css";

// La navegacion del panel se movio al menu superior, el mismo que usa el resto
// del sitio, para no mantener dos sistemas de navegacion en paralelo.
function AdminLayout({ title, subtitle, children }) {
  return (
    <div className="admin-layout">
      <section className="admin-main">
        {/* El titulo de la pantalla vive solo aqui: cada vista aporta su propio
            subtitulo en vez de repetir un encabezado dentro del contenido. */}
        <header className="admin-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}

export default AdminLayout;
