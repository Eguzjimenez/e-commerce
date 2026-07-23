import { act, render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../../constants/roles";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }) => <div>Navegar a {to}</div>,
    useLocation: () => ({ pathname: "/privada" }),
  }),
  { virtual: true }
);

beforeEach(() => {
  localStorage.clear();
});

test("redirects immediately when the active session expires", () => {
  localStorage.setItem(
    "concre_innova_auth",
    JSON.stringify({
      codigo: 1,
      idUsuario: 20,
      idRol: 3,
      nombreRol: ROLES.CLIENTE,
      token: "expired-token",
    })
  );

  render(
    <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
      <div>Contenido privado</div>
    </ProtectedRoute>
  );

  expect(screen.getByText("Contenido privado")).toBeInTheDocument();

  act(() => {
    localStorage.removeItem("concre_innova_auth");
    window.dispatchEvent(new Event("authchange"));
  });

  expect(screen.getByText("Navegar a /login")).toBeInTheDocument();
});
