export function getPasswordPolicyMessage(password) {
  if (!password) {
    return "Ingresa una contraseña.";
  }

  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayuscula.";
  }

  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minuscula.";
  }

  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un caracter especial.";
  }

  return "";
}
