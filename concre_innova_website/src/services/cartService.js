const CART_STORAGE_KEY = "concre_innova_cart";

function notifyCartChanged() {
  window.dispatchEvent(new Event("cartchange"));
}

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  notifyCartChanged();
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const idProducto = Number(product.idProducto ?? product.id);
  const idVariante = product.idVariante != null ? Number(product.idVariante) : null;
  const existingItem = cart.find(
    (item) =>
      Number(item.idProducto) === idProducto &&
      Number(item.idVariante || 0) === Number(idVariante || 0)
  );

  if (existingItem) {
    existingItem.cantidad += quantity;
  } else {
    cart.push({
      idProducto,
      nombre: product.nombre ?? product.name ?? "Producto",
      descripcion: product.descripcion ?? product.description ?? "",
      precio: Number(product.precio ?? product.price) || 0,
      imagen: product.imagen ?? product.imageName ?? product.img ?? "",
      idVariante,
      nombreVariante: product.nombreVariante ?? "",
      tamano: product.tamano ?? "",
      material: product.material ?? "",
      color: product.color ?? "",
      cantidad: quantity,
    });
  }

  saveCart(cart);
  return cart;
}

function matchesCartItem(item, idProducto, idVariante) {
  return (
    Number(item.idProducto) === Number(idProducto) &&
    Number(item.idVariante || 0) === Number(idVariante || 0)
  );
}

export function removeFromCart(idProducto, idVariante = null) {
  const nextCart = getCart().filter(
    (item) => !matchesCartItem(item, idProducto, idVariante)
  );
  saveCart(nextCart);
  return nextCart;
}

export function updateCartItemQuantity(
  idProducto,
  idVariante,
  quantity
) {
  const normalizedQuantity = Math.max(1, Number(quantity) || 1);
  const nextCart = getCart().map((item) =>
    matchesCartItem(item, idProducto, idVariante)
      ? { ...item, cantidad: normalizedQuantity }
      : item
  );
  saveCart(nextCart);
  return nextCart;
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  notifyCartChanged();
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
}

export function getCartPayloadForAuth() {
  return getCart().map((item) => ({
    productoId: Number(item.idProducto),
    varianteId: item.idVariante ? Number(item.idVariante) : null,
    cantidad: Number(item.cantidad) || 1,
  }));
}
