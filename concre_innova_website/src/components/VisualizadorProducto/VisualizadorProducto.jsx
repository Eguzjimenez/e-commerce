import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Swal from "sweetalert2";
import SelectorProductoSimulacion from "./SelectorProductoSimulacion";
import ListaProductosSimulacion from "./ListaProductosSimulacion";
import { getCatalogProducts } from "../../services/catalogService";
import { addToCart } from "../../services/cartService";
import { isLoggedIn } from "../../services/authService";
import {
  formatCatalogPrice,
  getCatalogProductImage,
} from "../../services/catalogPresentationService";
import {
  calcularPosicionProductoEnEspacio,
  calcularTamanoProductoEnEspacio,
} from "../../services/simulationScaleService";
import {
  deleteVisualization,
  getMyVisualizations,
  getSpaceImageUrl,
  saveVisualization,
  uploadSpaceImage,
} from "../../services/visualizationService";
import "./VisualizadorProducto.css";

const TAMANO_MINIMO_EN_LIENZO = 30;

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Imagen no disponible"));
      return;
    }

    const imagen = new window.Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    imagen.src = url;
  });
}

/**
 * Reutiliza la resolucion de imagenes del catalogo, que ya incluye la imagen
 * de respaldo cuando el producto no tiene una ruta utilizable.
 */
function obtenerUrlImagenProducto(producto) {
  return producto?.Imagen || getCatalogProductImage(producto);
}

function crearIdItem() {
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarProducto(producto) {
  return {
    idProducto: Number(producto?.idProducto ?? producto?.IdProducto ?? 0),
    nombre: producto?.nombre ?? producto?.Nombre ?? "Producto",
    descripcion: producto?.descripcion ?? "",
    precio: Number(producto?.precio ?? producto?.Precio ?? 0),
    imagen: producto?.imagen ?? "",
    Imagen: producto?.Imagen,
    tamano: producto?.tamano ?? "",
    material: producto?.material ?? "",
    nombreTipo: producto?.nombreTipo ?? "",
    idVariante: producto?.idVariante ?? null,
    nombreVariante: producto?.nombreVariante ?? "",
  };
}

function VisualizadorProducto({ producto, productosRecomendados = [], onClose }) {
  const [imagenEspacio, setImagenEspacio] = useState(null);
  const [urlObjetoEspacio, setUrlObjetoEspacio] = useState(null);
  const [rutaImagenEspacio, setRutaImagenEspacio] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [items, setItems] = useState([]);
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);
  const [maceteros, setMaceteros] = useState([]);
  const [visualizacionesGuardadas, setVisualizacionesGuardadas] = useState([]);
  const [visualizacionActualId, setVisualizacionActualId] = useState(null);
  const [mostrarGuardadas, setMostrarGuardadas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const productoInicialAgregadoRef = useRef(false);
  const nodosItemsRef = useRef({});
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

  const usuarioAutenticado = isLoggedIn();

  useEffect(() => {
    const actualizarTamano = () => {
      const maxWidth = Math.min(window.innerWidth - 420, 900);
      const maxHeight = Math.min(window.innerHeight - 260, 650);

      setStageSize({
        width: Math.max(maxWidth, 300),
        height: Math.max(maxHeight, 300),
      });
    };

    actualizarTamano();
    window.addEventListener("resize", actualizarTamano);

    return () => window.removeEventListener("resize", actualizarTamano);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const cargarMaceteros = async () => {
      try {
        const respuesta = await getCatalogProducts({
          type: "Maceta",
          page: 1,
          pageSize: 50,
          signal: controller.signal,
        });
        const encontrados = Array.isArray(respuesta?.items)
          ? respuesta.items
          : Array.isArray(respuesta)
          ? respuesta
          : [];

        setMaceteros(
          encontrados.map((macetero) => ({
            idProducto: macetero.idProducto,
            nombre: macetero.nombre,
          }))
        );
      } catch (error) {
        if (error?.name !== "AbortError") {
          setMaceteros([]);
        }
      }
    };

    cargarMaceteros();
    return () => controller.abort();
  }, []);

  const refrescarVisualizacionesGuardadas = useCallback(async () => {
    if (!usuarioAutenticado) {
      return;
    }

    try {
      const respuesta = await getMyVisualizations();
      setVisualizacionesGuardadas(Array.isArray(respuesta) ? respuesta : []);
    } catch {
      setVisualizacionesGuardadas([]);
    }
  }, [usuarioAutenticado]);

  useEffect(() => {
    refrescarVisualizacionesGuardadas();
  }, [refrescarVisualizacionesGuardadas]);

  useEffect(() => {
    return () => {
      if (urlObjetoEspacio) {
        URL.revokeObjectURL(urlObjetoEspacio);
      }
    };
  }, [urlObjetoEspacio]);

  const agregarProductoASimulacion = useCallback(
    async (productoSeleccionado) => {
      if (!imagenEspacio) {
        setAviso("Primero sube la foto de tu espacio.");
        return;
      }

      const normalizado = normalizarProducto(productoSeleccionado);

      try {
        const imagen = await cargarImagen(obtenerUrlImagenProducto(normalizado));
        const tamano = calcularTamanoProductoEnEspacio(normalizado, stageSize, imagen);

        setItems((itemsActuales) => {
          const posicion = calcularPosicionProductoEnEspacio(
            stageSize,
            tamano,
            itemsActuales.length
          );
          const nuevoItem = {
            idItem: crearIdItem(),
            producto: normalizado,
            imagen,
            config: { ...posicion, ...tamano, rotation: 0 },
            cantidad: 1,
            color: "",
            macetero: "",
          };

          setItemSeleccionadoId(nuevoItem.idItem);
          return [...itemsActuales, nuevoItem];
        });

        setAviso("");
      } catch {
        setAviso("No se pudo cargar la imagen de ese producto.");
      }
    },
    [imagenEspacio, stageSize]
  );

  useEffect(() => {
    if (!producto || !imagenEspacio || productoInicialAgregadoRef.current) {
      return;
    }

    productoInicialAgregadoRef.current = true;
    agregarProductoASimulacion(producto);
  }, [producto, imagenEspacio, agregarProductoASimulacion]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const nodoSeleccionado = nodosItemsRef.current[itemSeleccionadoId];

    if (!transformer) {
      return;
    }

    transformer.nodes(nodoSeleccionado ? [nodoSeleccionado] : []);
    transformer.getLayer()?.batchDraw();
  }, [itemSeleccionadoId, items]);

  const totalSimulacion = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.producto.precio * item.cantidad,
        0
      ),
    [items]
  );

  const aplicarImagenEspacio = async (imagen, url, ruta) => {
    if (urlObjetoEspacio) {
      URL.revokeObjectURL(urlObjetoEspacio);
    }

    setImagenEspacio(imagen);
    setUrlObjetoEspacio(url);
    setRutaImagenEspacio(ruta);
  };

  const manejarImagenEspacio = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setAviso("Selecciona un archivo de imagen valido.");
      return;
    }

    const url = URL.createObjectURL(archivo);
    setSubiendoImagen(true);
    setAviso("");

    try {
      const imagen = await cargarImagen(url);
      let ruta = "";

      if (usuarioAutenticado) {
        const respuesta = await uploadSpaceImage(archivo);
        ruta = respuesta?.rutaImagenEspacio || "";
      }

      await aplicarImagenEspacio(imagen, url, ruta);

      if (!usuarioAutenticado) {
        setAviso(
          "Imagen cargada. Inicia sesion si quieres guardar esta visualizacion en tu perfil."
        );
      }
    } catch (error) {
      URL.revokeObjectURL(url);
      setAviso(error?.message || "No se pudo cargar la imagen del espacio.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const quitarImagenEspacio = () => {
    if (urlObjetoEspacio) {
      URL.revokeObjectURL(urlObjetoEspacio);
    }

    setImagenEspacio(null);
    setUrlObjetoEspacio(null);
    setRutaImagenEspacio("");
    setItems([]);
    setItemSeleccionadoId(null);
    setVisualizacionActualId(null);
    productoInicialAgregadoRef.current = false;
  };

  const actualizarItem = (idItem, cambios) => {
    setItems((itemsActuales) =>
      itemsActuales.map((item) =>
        item.idItem === idItem ? { ...item, ...cambios } : item
      )
    );
  };

  const actualizarConfiguracionItem = (idItem, cambios) => {
    setItems((itemsActuales) =>
      itemsActuales.map((item) =>
        item.idItem === idItem
          ? { ...item, config: { ...item.config, ...cambios } }
          : item
      )
    );
  };

  const eliminarItem = (idItem) => {
    delete nodosItemsRef.current[idItem];
    setItems((itemsActuales) =>
      itemsActuales.filter((item) => item.idItem !== idItem)
    );
    setItemSeleccionadoId((actual) => (actual === idItem ? null : actual));
  };

  const rotarItemSeleccionado = (grados) => {
    if (!itemSeleccionadoId) {
      return;
    }

    setItems((itemsActuales) =>
      itemsActuales.map((item) =>
        item.idItem === itemSeleccionadoId
          ? {
              ...item,
              config: { ...item.config, rotation: item.config.rotation + grados },
            }
          : item
      )
    );
  };

  const manejarTransformacion = (idItem) => {
    const nodo = nodosItemsRef.current[idItem];

    if (!nodo) {
      return;
    }

    const anchoEscalado = Math.max(
      TAMANO_MINIMO_EN_LIENZO,
      nodo.width() * nodo.scaleX()
    );
    const altoEscalado = Math.max(
      TAMANO_MINIMO_EN_LIENZO,
      nodo.height() * nodo.scaleY()
    );

    nodo.scaleX(1);
    nodo.scaleY(1);

    actualizarConfiguracionItem(idItem, {
      x: nodo.x(),
      y: nodo.y(),
      width: anchoEscalado,
      height: altoEscalado,
      rotation: nodo.rotation(),
    });
  };

  const construirProductosParaGuardar = () =>
    items.map((item, indice) => ({
      idProducto: item.producto.idProducto,
      idVariante: item.producto.idVariante || null,
      cantidad: item.cantidad,
      color: item.color,
      macetero: item.macetero,
      posicionX: Math.round(item.config.x),
      posicionY: Math.round(item.config.y),
      ancho: Math.round(item.config.width),
      alto: Math.round(item.config.height),
      rotacion: Math.round(item.config.rotation),
      orden: indice + 1,
    }));

  const guardarVisualizacion = async () => {
    if (!usuarioAutenticado) {
      setAviso("Inicia sesion para guardar la visualizacion en tu perfil.");
      return;
    }

    if (!rutaImagenEspacio) {
      setAviso("Vuelve a subir la foto del espacio para poder guardarla.");
      return;
    }

    if (items.length === 0) {
      setAviso("Agrega al menos un producto antes de guardar.");
      return;
    }

    const { value: nombre } = await Swal.fire({
      title: "Guardar visualizacion",
      input: "text",
      inputLabel: "Nombre del proyecto",
      inputValue:
        visualizacionesGuardadas.find(
          (visualizacion) => visualizacion.idVisualizacion === visualizacionActualId
        )?.nombre || "Mi espacio",
      inputAttributes: { maxlength: 120 },
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });

    if (!nombre) {
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await saveVisualization({
        idVisualizacion: visualizacionActualId,
        nombre,
        rutaImagenEspacio,
        anchoLienzo: stageSize.width,
        altoLienzo: stageSize.height,
        productos: construirProductosParaGuardar(),
      });

      setVisualizacionActualId(respuesta?.idVisualizacion ?? null);
      await refrescarVisualizacionesGuardadas();

      await Swal.fire({
        icon: "success",
        title: "Visualizacion guardada",
        text: respuesta?.mensaje || "La simulacion quedo guardada en tu perfil.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      setAviso(error?.message || "No fue posible guardar la visualizacion.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirVisualizacionGuardada = async (visualizacion) => {
    setAviso("");

    try {
      const imagen = await cargarImagen(
        getSpaceImageUrl(visualizacion.rutaImagenEspacio)
      );
      const itemsCargados = await Promise.all(
        (visualizacion.productos || []).map(async (guardado) => {
          const productoGuardado = normalizarProducto({
            idProducto: guardado.idProducto,
            nombre: guardado.nombre,
            precio: guardado.precio,
            imagen: guardado.imagen,
            tamano: guardado.tamano,
            material: guardado.material,
            idVariante: guardado.idVariante,
          });

          return {
            idItem: crearIdItem(),
            producto: productoGuardado,
            imagen: await cargarImagen(obtenerUrlImagenProducto(productoGuardado)),
            config: {
              x: Number(guardado.posicionX),
              y: Number(guardado.posicionY),
              width: Number(guardado.ancho),
              height: Number(guardado.alto),
              rotation: Number(guardado.rotacion),
            },
            cantidad: Number(guardado.cantidad) || 1,
            color: guardado.color || "",
            macetero: guardado.macetero || "",
          };
        })
      );

      productoInicialAgregadoRef.current = true;
      await aplicarImagenEspacio(imagen, null, visualizacion.rutaImagenEspacio);
      setItems(itemsCargados);
      setItemSeleccionadoId(null);
      setVisualizacionActualId(visualizacion.idVisualizacion);
      setMostrarGuardadas(false);
    } catch (error) {
      setAviso(error?.message || "No fue posible abrir la visualizacion guardada.");
    }
  };

  const eliminarVisualizacionGuardada = async (visualizacion) => {
    const confirmacion = await Swal.fire({
      icon: "question",
      title: "Eliminar visualizacion",
      text: `Se eliminara "${visualizacion.nombre}" de tu perfil.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      await deleteVisualization(visualizacion.idVisualizacion);

      if (visualizacionActualId === visualizacion.idVisualizacion) {
        setVisualizacionActualId(null);
      }

      await refrescarVisualizacionesGuardadas();
    } catch (error) {
      setAviso(error?.message || "No fue posible eliminar la visualizacion.");
    }
  };

  const agregarSimulacionAlCarrito = async () => {
    if (items.length === 0) {
      setAviso("Agrega productos a la simulacion antes de comprarlos.");
      return;
    }

    items.forEach((item) => {
      addToCart(
        {
          idProducto: item.producto.idProducto,
          nombre: item.producto.nombre,
          descripcion: item.producto.descripcion,
          precio: item.producto.precio,
          imagen: item.producto.imagen,
          idVariante: item.producto.idVariante,
          nombreVariante: item.producto.nombreVariante,
          tamano: item.producto.tamano,
          material: item.producto.material,
          nombreTipo: item.producto.nombreTipo,
          color: item.color,
          macetero: item.macetero,
        },
        item.cantidad
      );
    });

    await Swal.fire({
      icon: "success",
      title: "Productos agregados al carrito",
      text: `${items.length} producto(s) de tu simulacion se agregaron por ${formatCatalogPrice(
        totalSimulacion
      )}.`,
    });
  };

  return (
    <div className="visualizador-overlay" role="dialog" aria-modal="true">
      <div className="visualizador-modal">
        <div className="visualizador-header">
          <div>
            <h2>Visualizar en mi espacio</h2>
            <p>Sube una foto, coloca productos y guarda la simulacion.</p>
          </div>

          <button type="button" onClick={onClose} className="visualizador-close">
            x
          </button>
        </div>

        <div className="visualizador-layout">
          <div className="visualizador-principal">
            <div className="visualizador-controls">
              <label className="visualizador-upload-button">
                {imagenEspacio ? "Cambiar foto" : "Subir Imagen"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={manejarImagenEspacio}
                  disabled={subiendoImagen}
                  hidden
                />
              </label>

              {imagenEspacio && (
                <>
                  <button
                    type="button"
                    onClick={() => rotarItemSeleccionado(-15)}
                    disabled={!itemSeleccionadoId}
                    title="Rotar -15 grados"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={() => rotarItemSeleccionado(15)}
                    disabled={!itemSeleccionadoId}
                    title="Rotar +15 grados"
                  >
                    ↻
                  </button>
                  <button type="button" onClick={quitarImagenEspacio} className="danger">
                    Quitar foto
                  </button>
                </>
              )}

              {usuarioAutenticado && (
                <button
                  type="button"
                  onClick={() => setMostrarGuardadas((valor) => !valor)}
                >
                  Mis visualizaciones ({visualizacionesGuardadas.length})
                </button>
              )}
            </div>

            {subiendoImagen && (
              <p className="simulacion-estado">Cargando imagen del espacio...</p>
            )}

            {aviso && <p className="visualizador-warning">{aviso}</p>}

            {mostrarGuardadas && usuarioAutenticado && (
              <ul className="visualizador-guardadas">
                {visualizacionesGuardadas.length === 0 && (
                  <li className="simulacion-estado">
                    Todavia no has guardado visualizaciones.
                  </li>
                )}

                {visualizacionesGuardadas.map((visualizacion) => (
                  <li key={visualizacion.idVisualizacion}>
                    <button
                      type="button"
                      onClick={() => abrirVisualizacionGuardada(visualizacion)}
                    >
                      <strong>{visualizacion.nombre}</strong>
                      <small>{visualizacion.totalProductos} producto(s)</small>
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => eliminarVisualizacionGuardada(visualizacion)}
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="visualizador-canvas-container">
              {!imagenEspacio ? (
                <div className="visualizador-empty">
                  <h3>Sube una foto de tu espacio</h3>
                  <p>Luego podrás colocar productos, moverlos y escalarlos.</p>
                </div>
              ) : (
                <Stage
                  ref={stageRef}
                  width={stageSize.width}
                  height={stageSize.height}
                  onMouseDown={(event) => {
                    if (event.target === event.target.getStage()) {
                      setItemSeleccionadoId(null);
                    }
                  }}
                >
                  <Layer>
                    <KonvaImage
                      image={imagenEspacio}
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                    />

                    {items.map((item) => (
                      <KonvaImage
                        key={item.idItem}
                        ref={(nodo) => {
                          if (nodo) {
                            nodosItemsRef.current[item.idItem] = nodo;
                          }
                        }}
                        image={item.imagen}
                        x={item.config.x}
                        y={item.config.y}
                        width={item.config.width}
                        height={item.config.height}
                        rotation={item.config.rotation}
                        draggable
                        onMouseDown={() => setItemSeleccionadoId(item.idItem)}
                        onTouchStart={() => setItemSeleccionadoId(item.idItem)}
                        onDragEnd={(event) =>
                          actualizarConfiguracionItem(item.idItem, {
                            x: event.target.x(),
                            y: event.target.y(),
                          })
                        }
                        onTransformEnd={() => manejarTransformacion(item.idItem)}
                      />
                    ))}

                    <Transformer
                      ref={transformerRef}
                      rotateEnabled
                      enabledAnchors={[
                        "top-left",
                        "top-right",
                        "bottom-left",
                        "bottom-right",
                      ]}
                      keepRatio
                      boundBoxFunc={(oldBox, newBox) =>
                        newBox.width < TAMANO_MINIMO_EN_LIENZO ||
                        newBox.height < TAMANO_MINIMO_EN_LIENZO
                          ? oldBox
                          : newBox
                      }
                    />
                  </Layer>
                </Stage>
              )}
            </div>

            {imagenEspacio && (
              <div className="visualizador-instrucciones">
                Arrastra un producto para moverlo y usa las esquinas para escalarlo.
              </div>
            )}
          </div>

          <aside className="visualizador-panel">
            <SelectorProductoSimulacion
              productosRecomendados={productosRecomendados}
              onAgregarProducto={agregarProductoASimulacion}
              deshabilitado={!imagenEspacio}
            />

            <div className="visualizador-panel-seccion">
              <h3>Productos en tu espacio</h3>

              <ListaProductosSimulacion
                items={items}
                maceteros={maceteros}
                itemSeleccionadoId={itemSeleccionadoId}
                onSeleccionarItem={setItemSeleccionadoId}
                onActualizarItem={actualizarItem}
                onEliminarItem={eliminarItem}
              />
            </div>

            <div className="visualizador-panel-acciones">
              <div className="visualizador-total">
                <span>Total simulado</span>
                <strong>{formatCatalogPrice(totalSimulacion)}</strong>
              </div>

              <button
                type="button"
                className="btn"
                onClick={agregarSimulacionAlCarrito}
                disabled={items.length === 0}
              >
                Agregar al Carrito
              </button>

              <button
                type="button"
                onClick={guardarVisualizacion}
                disabled={guardando || items.length === 0}
              >
                {guardando ? "Guardando..." : "Guardar Visualizacion"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default VisualizadorProducto;
