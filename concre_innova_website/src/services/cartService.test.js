import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "./cartService";

beforeEach(() => {
  localStorage.clear();
});

test("updates and removes only the selected product variant", () => {
  addToCart({ idProducto: 1, idVariante: 10, nombre: "Maceta pequena" });
  addToCart({ idProducto: 1, idVariante: 11, nombre: "Maceta grande" });

  updateCartItemQuantity(1, 11, 3);

  expect(getCart()).toEqual([
    expect.objectContaining({ idVariante: 10, cantidad: 1 }),
    expect.objectContaining({ idVariante: 11, cantidad: 3 }),
  ]);

  removeFromCart(1, 10);

  expect(getCart()).toEqual([
    expect.objectContaining({ idVariante: 11, cantidad: 3 }),
  ]);
});
