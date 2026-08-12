import {
  calcularPosicionProductoEnEspacio,
  calcularTamanoProductoEnEspacio,
  obtenerAlturaProductoCm,
} from "./simulationScaleService";

const ESPACIO = { width: 900, height: 600 };

function imagenDe(naturalWidth, naturalHeight) {
  return { naturalWidth, naturalHeight };
}

test("reads the real height from sizes expressed in centimetres", () => {
  expect(obtenerAlturaProductoCm({ tamano: "20cm" })).toBe(20);
  expect(obtenerAlturaProductoCm({ tamano: "30 cm" })).toBe(30);
});

test("maps qualitative sizes and accents to an estimated height", () => {
  expect(obtenerAlturaProductoCm({ tamano: "Mediano" })).toBe(35);
  expect(obtenerAlturaProductoCm({ tamano: "Grande" })).toBe(60);
  expect(obtenerAlturaProductoCm({ tamano: "XL" })).toBe(90);
  expect(obtenerAlturaProductoCm({ tamano: "Pequeño" })).toBe(20);
});

test("falls back to a default height when the size is unknown", () => {
  expect(obtenerAlturaProductoCm({ tamano: "No especificado" })).toBe(35);
  expect(obtenerAlturaProductoCm({})).toBe(35);
});

test("scales a bigger product larger than a smaller one", () => {
  const pequeno = calcularTamanoProductoEnEspacio(
    { tamano: "20cm" },
    ESPACIO,
    imagenDe(200, 200)
  );
  const grande = calcularTamanoProductoEnEspacio(
    { tamano: "XL" },
    ESPACIO,
    imagenDe(200, 200)
  );

  expect(grande.height).toBeGreaterThan(pequeno.height);
  expect(pequeno.height).toBe(Math.round((20 / 250) * ESPACIO.height));
});

test("never lets the product exceed the available space", () => {
  const enorme = calcularTamanoProductoEnEspacio(
    { tamano: "900cm" },
    ESPACIO,
    imagenDe(200, 200)
  );

  expect(enorme.height).toBeLessThanOrEqual(ESPACIO.height * 0.6);
  expect(enorme.width).toBeLessThanOrEqual(ESPACIO.width * 0.6);
});

test("keeps the product image proportions", () => {
  const tamano = calcularTamanoProductoEnEspacio(
    { tamano: "Grande" },
    ESPACIO,
    imagenDe(400, 200)
  );

  expect(tamano.width / tamano.height).toBeCloseTo(2, 1);
});

test("applies a minimum size so tiny products stay usable", () => {
  const diminuto = calcularTamanoProductoEnEspacio(
    { tamano: "1cm" },
    ESPACIO,
    imagenDe(200, 200)
  );

  expect(diminuto.height).toBeGreaterThanOrEqual(40);
});

test("places every product inside the space and staggers them", () => {
  const tamano = { width: 120, height: 160 };
  const primera = calcularPosicionProductoEnEspacio(ESPACIO, tamano, 0);
  const segunda = calcularPosicionProductoEnEspacio(ESPACIO, tamano, 1);

  expect(primera).not.toEqual(segunda);

  [primera, segunda].forEach((posicion) => {
    expect(posicion.x).toBeGreaterThanOrEqual(0);
    expect(posicion.y).toBeGreaterThanOrEqual(0);
    expect(posicion.x + tamano.width).toBeLessThanOrEqual(ESPACIO.width);
    expect(posicion.y + tamano.height).toBeLessThanOrEqual(ESPACIO.height);
  });
});
