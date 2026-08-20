import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { getRolePermissions, updateRolePermissions } from "../../services/permissionService";
import "./AdminPermissions.css";

function AdminPermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getRolePermissions();
      const nextRoles = Array.isArray(response) ? response : [];
      setRoles(nextRoles);

      const firstRole = nextRoles[0];
      if (firstRole) {
        setSelectedRoleId(String(firstRole.idRol));
        setSelectedPermissionIds(getAssignedPermissionIds(firstRole));
      }
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los permisos.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = useMemo(() => {
    return roles.find((role) => String(role.idRol) === String(selectedRoleId));
  }, [roles, selectedRoleId]);

  const permissionsByModule = useMemo(() => {
    const permissions = selectedRole?.permisos || [];
    return permissions.reduce((groups, permission) => {
      const moduleName = permission.modulo || "General";
      groups[moduleName] = groups[moduleName] || [];
      groups[moduleName].push(permission);
      return groups;
    }, {});
  }, [selectedRole]);

  const handleRoleChange = (event) => {
    const roleId = event.target.value;
    const role = roles.find((item) => String(item.idRol) === String(roleId));

    setSelectedRoleId(roleId);
    setSelectedPermissionIds(getAssignedPermissionIds(role));
  };

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissionIds((previous) => {
      const next = new Set(previous);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      return;
    }

    setSaving(true);

    try {
      await updateRolePermissions(selectedRole.idRol, [...selectedPermissionIds]);
      await Swal.fire({
        icon: "success",
        title: "Permisos actualizados",
        text: "Los permisos del rol se guardaron correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });
      await loadPermissions();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudieron guardar",
        text: saveError.message || "Verifica los permisos seleccionados.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Permisos"
      subtitle="Define qué puede hacer cada rol dentro del sistema.">
      <div className="admin-permissions-page">
        <div className="admin-permissions-toolbar">
          <label>
            Rol
            <select value={selectedRoleId} onChange={handleRoleChange} disabled={loading}>
              {roles.map((role) => (
                <option key={role.idRol} value={role.idRol}>
                  {role.nombreRol}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="admin-primary-button"
            onClick={handleSave}
            disabled={saving || !selectedRole}
          >
            {saving ? "Guardando..." : "Guardar permisos"}
          </button>
        </div>

        {loading && <div className="admin-permissions-status">Cargando permisos...</div>}
        {!loading && error && <div className="admin-permissions-error">{error}</div>}

        {!loading && !error && selectedRole && (
          <div className="admin-permissions-grid">
            {Object.entries(permissionsByModule).map(([moduleName, permissions]) => (
              <section className="admin-permission-group" key={moduleName}>
                <h2>{moduleName}</h2>
                {permissions.map((permission) => (
                  <label className="admin-permission-item" key={permission.idPermiso}>
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.has(permission.idPermiso)}
                      onChange={() => handleTogglePermission(permission.idPermiso)}
                    />
                    <span>
                      <strong>{permission.nombre}</strong>
                      <small>{permission.descripcion || permission.codigo}</small>
                    </span>
                  </label>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function getAssignedPermissionIds(role) {
  return new Set(
    (role?.permisos || [])
      .filter((permission) => permission.asignado)
      .map((permission) => permission.idPermiso)
  );
}

export default AdminPermissions;
