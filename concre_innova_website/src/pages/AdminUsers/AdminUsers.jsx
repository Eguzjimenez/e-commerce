import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  deactivateUser,
  getRoles,
  getUserDetail,
  getUserList,
  newUser,
  updateUser,
} from "../../services/userService";
import "./AdminUsers.css";
import { registerBitacora } from "../../services/bitacoraService";
import { getAuth } from "../../services/authService";

const roleNames = {
  1: "Administrador",
  2: "Vendedor",
  3: "Cliente",
  4: "Inactivo",
};

const roleOptions = [
  { id: 1, label: "Administrador" },
  { id: 2, label: "Vendedor" },
  { id: 3, label: "Cliente" },
  { id: 4, label: "Inactivo" },
];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    idUsuario: null,
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    telefono: "",
    idRol: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([getUserList(), getRoles()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo cargar la informacion de usuarios.",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesSearch = [user.nombre, user.apellido, user.correo, user.telefono]
        .join(" ")
        .toLowerCase()
        .includes(term);

      const matchesRole =
        selectedRole === "Todos" || user.idRol === Number(selectedRole);

      return matchesSearch && matchesRole;
    });
  }, [searchTerm, selectedRole, users]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedUser(null);
    setFormData({
      idUsuario: null,
      nombre: "",
      apellido: "",
      correo: "",
      contrasena: "",
      telefono: "",
      idRol: roles.length > 0 ? roles[0].idRol : 3,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(null);
    setFormData({
      ...user,
      contrasena: "",
    });
    setIsModalOpen(true);
  };

  const openDetailModal = async (user) => {
    setIsModalOpen(false);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setSelectedUser(null);

    try {
      const detail = await getUserDetail(user.idUsuario);
      setSelectedUser(detail);
    } catch (error) {
      setIsDetailOpen(false);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo cargar el detalle del usuario.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setSelectedUser(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue = name === "telefono"
      ? value.replace(/\D/g, "")
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "idRol" ? Number(normalizedValue) : normalizedValue,
    }));
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.nombre || !formData.apellido || !formData.correo || !formData.telefono) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Completa todos los campos obligatorios.",
      });
      return;
    }

    if (!emailPattern.test(formData.correo.trim())) {
      await Swal.fire({
        icon: "warning",
        title: "Correo invalido",
        text: "Ingresa un correo electronico valido.",
      });
      return;
    }

    if (!/^\d+$/.test(formData.telefono) || formData.telefono.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Telefono invalido",
        text: "El telefono solo puede contener numeros.",
      });
      return;
    }

    if (modalMode === "add" && !formData.contrasena) {
      await Swal.fire({
        icon: "warning",
        title: "Contrasena requerida",
        text: "Ingresa una contrasena para el nuevo usuario.",
      });
      return;
    }

    if (modalMode === "add" && formData.contrasena.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "Contrasena invalida",
        text: "La contrasena debe tener al menos 8 caracteres.",
      });
      return;
    }

    try {
      const payload = { ...formData };
      if (modalMode === "edit" && !payload.contrasena) {
        delete payload.contrasena;
      }

      await (modalMode === "add" ? newUser(payload) : updateUser(payload));
      const auth = getAuth(); 
      await registerBitacora({
        idUsuario:     auth.idUsuario,
        tablaAfectada: "Usuarios",
        operacion:     modalMode === "add" ? "INSERT" : "UPDATE",
        descripcion:   modalMode === "add"
          ? `Usuario creado: ${formData.correo}`
          : `Usuario actualizado: ${formData.correo}`,
      });
      await Swal.fire({
        icon: "success",
        title: modalMode === "add" ? "Usuario creado" : "Usuario actualizado",
        text:
          modalMode === "add"
            ? "El usuario ha sido creado correctamente."
            : "Los datos del usuario se han actualizado correctamente.",
      });
      closeModal();
      await loadData();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo guardar el usuario.",
      });
    }
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Inactivar usuario",
      text: `Deseas inactivar al usuario ${user.nombre} ${user.apellido}?`,
      showCancelButton: true,
      confirmButtonText: "Si, inactivar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deactivateUser(user.idUsuario);
      await Swal.fire({
        icon: "success",
        title: "Usuario inactivado",
        text: "El usuario fue marcado como inactivo.",
      });
      await loadData();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo inactivar el usuario.",
      });
    }
  };

  const availableRoleOptions =
    roles.length > 0
      ? roles.map((role) => ({ id: role.idRol, label: role.nombreRol }))
      : roleOptions;

  const getRoleLabel = (idRol) => {
    const role = roles.find((roleItem) => roleItem.idRol === idRol);
    return role?.nombreRol || roleNames[idRol] || "Desconocido";
  };

  const formatDate = (value) => {
    if (!value) {
      return "No disponible";
    }

    return new Date(value).toLocaleString();
  };

  return (
    <AdminLayout title="Gestion de Usuarios">
      <div className="admin-users-page">
        <div className="admin-users-topbar">
          <div className="admin-users-filters">
            <div className="admin-users-searchbar">
              <input
                type="text"
                placeholder="Buscar usuario"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="admin-users-role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="Todos">Todos los roles</option>
              {roles.map((role) => (
                <option key={role.idRol} value={role.idRol}>
                  {role.nombreRol}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-primary-button" onClick={openAddModal}>
            Agregar usuario
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Telefono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.idUsuario}>
                  <td>
                    <button
                      type="button"
                      className="user-name-button"
                      onClick={() => openDetailModal(user)}
                    >
                      {`${user.nombre} ${user.apellido}`}
                    </button>
                  </td>
                  <td>{user.correo}</td>
                  <td>{user.telefono}</td>
                  <td>{getRoleLabel(user.idRol)}</td>
                  <td className="admin-users-actions">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => openDetailModal(user)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="action-button edit"
                      onClick={() => openEditModal(user)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="action-button delete"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.idRol === 4}
                    >
                      Inactivar
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-empty-row">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>
                  {modalMode === "add" ? "Agregar usuario" : "Editar usuario"}
                </h2>
                <button className="modal-close" onClick={closeModal}>
                  x
                </button>
              </div>

              <form className="admin-user-form" onSubmit={handleSaveUser}>
                <div className="form-row">
                  <label>Nombre</label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Apellido</label>
                  <input
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Correo</label>
                  <input
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleFormChange}
                    inputMode="email"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Telefono</label>
                  <input
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleFormChange}
                    inputMode="numeric"
                    pattern="[0-9]+"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Rol</label>
                  <select
                    name="idRol"
                    value={formData.idRol}
                    onChange={handleFormChange}
                  >
                    {availableRoleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                {modalMode === "add" && (
                  <div className="form-row">
                    <label>Contrasena</label>
                    <input
                      name="contrasena"
                      type="password"
                      value={formData.contrasena}
                      onChange={handleFormChange}
                      placeholder="Contrasena"
                      minLength="8"
                      required
                    />
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-primary-button">
                    {modalMode === "add" ? "Crear usuario" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDetailOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal admin-detail-modal">
              <div className="admin-modal-header">
                <h2>Detalle de usuario</h2>
                <button className="modal-close" onClick={closeDetailModal}>
                  x
                </button>
              </div>

              {detailLoading && <p className="admin-detail-loading">Cargando detalle...</p>}

              {!detailLoading && selectedUser && (
                <div className="admin-user-detail-grid">
                  <div className="detail-item">
                    <span>Nombre</span>
                    <strong>{`${selectedUser.nombre} ${selectedUser.apellido}`}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Correo</span>
                    <strong>{selectedUser.correo}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Telefono</span>
                    <strong>{selectedUser.telefono || "No disponible"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Rol</span>
                    <strong>{selectedUser.nombreRol || getRoleLabel(selectedUser.idRol)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Estado</span>
                    <strong>{selectedUser.idRol === 4 ? "Inactivo" : selectedUser.estado}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Fecha de registro</span>
                    <strong>{formatDate(selectedUser.fechaRegistro)}</strong>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={closeDetailModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
