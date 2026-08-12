/**
 * Calculos de escala para la simulacion visual del producto sobre la foto del
 * espacio. El objetivo es que un producto de 20 cm se vea claramente mas
 * pequeno que uno de 90 cm y que ninguno desborde el area disponible.
 */

/** Altura real aproximada que representa la foto de un espacio. */
const ALTURA_ESPACIO_REFERENCIA_CM = 250;

/** Altura estimada para los tamanos que no vienen expresados en centimetros. */
const ALTURAS_POR_TAMANO_CM = {
  pequeno: 20,
  pequena: 20,
  chico: 20,
  mediano: 35,
  mediana: 35,
  grande: 60,
  xl: 90,
  extragrande: 90,
};

const ALTURA_POR_DEFECTO_CM = 35;

/** El producto nunca ocupa mas de esta fraccion del alto o ancho del espacio. */
const PROPORCION_MAXIMA_DEL_ESPACIO = 0.6;

const TAMANO_MINIMO_PX = 40;

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(MARCAS_DIACRITICAS, "")
    .trim()
    .toLowerCase();
}

/**
 * Obtiene la altura real del producto en centimetros a partir de su atributo
 * "tamano" ("20cm", "Mediano", "XL"...).
 */
export function obtenerAlturaProductoCm(producto) {
  const tamano = normalizarTexto(producto?.tamano ?? producto?.Tamano);

  if (!tamano) {
    return ALTURA_POR_DEFECTO_CM;
  }

  const centimetros = tamano.match(/(\d+(?:[.,]\d+)?)\s*cm/);

  if (centimetros) {
    const valor = Number(centimetros[1].replace(",", "."));
    return valor > 0 ? valor : ALTURA_POR_DEFECTO_CM;
  }

  const tamanoSinEspacios = tamano.replace(/\s+/g, "");
  return ALTURAS_POR_TAMANO_CM[tamanoSinEspacios] ?? ALTURA_POR_DEFECTO_CM;
}

function obtenerRelacionDeAspecto(imagen) {
  const ancho = Number(imagen?.naturalWidth) || 0;
  const alto = Number(imagen?.naturalHeight) || 0;

  return ancho > 0 && alto > 0 ? ancho / alto : 1;
}

/**
 * Calcula el tamano en pixeles con el que debe insertarse el producto,
 * proporcional a su medida real y limitado al area disponible del espacio.
 */
export function calcularTamanoProductoEnEspacio(producto, stageSize, imagenProducto) {
  const alturaCm = obtenerAlturaProductoCm(producto);
  const relacionAspecto = obtenerRelacionDeAspecto(imagenProducto);
  const alturaProporcional =
    (alturaCm / ALTURA_ESPACIO_REFERENCIA_CM) * stageSize.height;

  const alturaMaxima = stageSize.height * PROPORCION_MAXIMA_DEL_ESPACIO;
  const anchoMaximo = stageSize.width * PROPORCION_MAXIMA_DEL_ESPACIO;

  let alto = Math.min(Math.max(alturaProporcional, TAMANO_MINIMO_PX), alturaMaxima);
  let ancho = alto * relacionAspecto;

  if (ancho > anchoMaximo) {
    ancho = anchoMaximo;
    alto = ancho / relacionAspecto;
  }

  return {
    width: Math.round(ancho),
    height: Math.round(alto),
  };
}

/**
 * Coloca el producto sobre el piso visual del espacio y escalona cada nuevo
 * producto para que no queden todos superpuestos.
 */
export function calcularPosicionProductoEnEspacio(stageSize, tamano, cantidadColocada = 0) {
  const desplazamiento = (cantidadColocada % 5) * 40;
  const x = stageSize.width / 2 - tamano.width / 2 + desplazamiento;
  const y = stageSize.height * 0.72 - tamano.height / 2 + desplazamiento / 2;

  return {
    x: limitarAlEspacio(x, stageSize.width, tamano.width),
    y: limitarAlEspacio(y, stageSize.height, tamano.height),
  };
}

function limitarAlEspacio(valor, limiteEspacio, tamanoProducto) {
  const maximo = Math.max(0, limiteEspacio - tamanoProducto);
  return Math.round(Math.min(Math.max(valor, 0), maximo));
}

export const SIMULATION_SCALE_REFERENCE = {
  ALTURA_ESPACIO_REFERENCIA_CM,
  PROPORCION_MAXIMA_DEL_ESPACIO,
  TAMANO_MINIMO_PX,
};
