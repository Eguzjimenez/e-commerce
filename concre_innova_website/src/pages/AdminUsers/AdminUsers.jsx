import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { getUserList, newUser, updateUser, getRoles } from "../../services/userService";
import "./AdminUsers.css";

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
        text: error.message || "No se pudo cargar la información de usuarios.",
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
    setFormData({
      ...user,
      contrasena: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "idRol" ? Number(value) : value,
    }));
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.correo || !formData.telefono) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Completa todos los campos obligatorios.",
      });
      return;
    }

    if (modalMode === "add" && !formData.contrasena) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña requerida",
        text: "Ingresa una contraseña para el nuevo usuario.",
      });
      return;
    }

    try {
      const payload = { ...formData };
      if (modalMode === "edit" && !payload.contrasena) {
        delete payload.contrasena;
      }

      await (modalMode === "add" ? newUser(payload) : updateUser(payload));
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
      text: `¿Deseas inactivar al usuario ${user.nombre} ${user.apellido}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await updateUser({
        ...user,
        idRol: 4,
      });
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

  return (
    <AdminLayout title="Gestión de Usuarios">
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
            + Agregar usuario
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.idUsuario}>
                  <td>{`${user.nombre} ${user.apellido}`}</td>
                  <td>{user.correo}</td>
                  <td>{user.telefono}</td>
                  <td>{getRoleLabel(user.idRol)}</td>
                  <td className="admin-users-actions">
                    <button
                      type="button"
                      className="icon-button edit"
                      onClick={() => openEditModal(user)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="icon-button delete"
                      onClick={() => handleDeleteUser(user)}
                    >
                      🗑️
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
                  ✕
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
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Teléfono</label>
                  <input
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleFormChange}
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
                <div className="form-row">
                  <label>
                    {modalMode === "add" ? "Contraseña" : "Contraseña (opcional)"}
                  </label>
                  <input
                    name="contrasena"
                    type="password"
                    value={formData.contrasena}
                    onChange={handleFormChange}
                    placeholder={
                      modalMode === "edit"
                        ? "Dejar vacío para no cambiar"
                        : "Contraseña"
                    }
                    {...(modalMode === "add" ? { required: true } : {})}
                  />
                </div>

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
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
