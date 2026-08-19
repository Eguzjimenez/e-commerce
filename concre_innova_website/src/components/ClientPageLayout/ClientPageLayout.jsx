import { Outlet } from "react-router-dom";
import HomeFooter from "../HomeFooter/HomeFooter";
import "./ClientPageLayout.css";

function ClientPageLayout() {
  return (
    <div className="client-page-layout">
      <main className="client-page-content">
        <Outlet />
      </main>
      <HomeFooter />
    </div>
  );
}

export default ClientPageLayout;
