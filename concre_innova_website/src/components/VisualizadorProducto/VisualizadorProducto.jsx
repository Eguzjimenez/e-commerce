import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { getProductImageCandidates } from "../../services/catalogService";
import "./VisualizadorProducto.css";

const INITIAL_PRODUCT_SIZE = 180;

function getProductName(producto) {
  return producto?.nombre || producto?.Nombre || "Producto";
}

function getProductPrice(producto) {
  return Number(producto?.precio ?? producto?.Precio ?? 0);
}

function getProductImageUrl(producto) {
  const explicitUrl =
    producto?.Imagen ||
    producto?.Image ||
    producto?.image ||
    null;

  if (explicitUrl) {
    return explicitUrl;
  }

  const rawImageName = producto?.imagen;
  const candidates = getProductImageCandidates(rawImageName);

  return candidates[0] || null;
}

function buildDefaultConfig(stageSize) {
  return {
    x: stageSize.width / 2 - INITIAL_PRODUCT_SIZE / 2,
    y: stageSize.height / 2 - INITIAL_PRODUCT_SIZE / 2,
    width: INITIAL_PRODUCT_SIZE,
    height: INITIAL_PRODUCT_SIZE,
    rotation: 0,
  };
}

function VisualizadorProducto({ producto, onClose }) {
  const [imagenUsuario, setImagenUsuario] = useState(null);
  const [imagenProducto, setImagenProducto] = useState(null);
  const [imagenUsuarioUrl, setImagenUsuarioUrl] = useState(null);
  const [cargandoProducto, setCargandoProducto] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [productoConfig, setProductoConfig] = useState({
    x: 300,
    y: 250,
    width: INITIAL_PRODUCT_SIZE,
    height: INITIAL_PRODUCT_SIZE,
    rotation: 0,
  });

  const productoRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const imageUrl = getProductImageUrl(producto);

    if (!imageUrl) {
      setImagenProducto(null);
      setCargandoProducto(false);
      return;
    }

    setCargandoProducto(true);

    const image = new window.Image();

    image.onload = () => {
      setImagenProducto(image);
      setCargandoProducto(false);
    };

    image.onerror = () => {
      setImagenProducto(null);
      setCargandoProducto(false);
    };

    image.src = imageUrl;
  }, [producto]);

  useEffect(() => {
    if (productoRef.current && transformerRef.current && imagenProducto) {
      transformerRef.current.nodes([productoRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [imagenProducto]);

  useEffect(() => {
    const actualizarTamano = () => {
      const maxWidth = Math.min(window.innerWidth - 80, 900);
      const maxHeight = Math.min(window.innerHeight - 250, 650);

      setStageSize({
        width: Math.max(maxWidth, 300),
        height: Math.max(maxHeight, 300),
      });
    };

    actualizarTamano();
    window.addEventListener("resize", actualizarTamano);

    return () => {
      window.removeEventListener("resize", actualizarTamano);
    };
  }, []);

  useEffect(() => {
    setProductoConfig(buildDefaultConfig(stageSize));
  }, [stageSize]);

  useEffect(() => {
    return () => {
      if (imagenUsuarioUrl) {
        URL.revokeObjectURL(imagenUsuarioUrl);
      }
    };
  }, [imagenUsuarioUrl]);

  const manejarImagenUsuario = (event) => {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      window.alert("Selecciona una imagen valida.");
      return;
    }

    const url = URL.createObjectURL(archivo);
    const image = new window.Image();

    image.onload = () => {
      if (imagenUsuarioUrl) {
        URL.revokeObjectURL(imagenUsuarioUrl);
      }

      setImagenUsuario(image);
      setImagenUsuarioUrl(url);
      setProductoConfig(buildDefaultConfig(stageSize));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      window.alert("No se pudo cargar la imagen.");
    };

    image.src = url;
  };

  const eliminarImagen = () => {
    if (imagenUsuarioUrl) {
      URL.revokeObjectURL(imagenUsuarioUrl);
    }

    setImagenUsuario(null);
    setImagenUsuarioUrl(null);
  };

  const manejarMovimiento = (event) => {
    const node = event.target;

    setProductoConfig((prev) => ({
      ...prev,
      x: node.x(),
      y: node.y(),
    }));
  };

  const manejarTransformacion = () => {
    const node = productoRef.current;

    if (!node) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const nuevaAnchura = Math.max(30, node.width() * scaleX);
    const nuevoAlto = Math.max(30, node.height() * scaleY);

    node.scaleX(1);
    node.scaleY(1);

    setProductoConfig({
      x: node.x(),
      y: node.y(),
      width: nuevaAnchura,
      height: nuevoAlto,
      rotation: node.rotation(),
    });
  };

  const rotarProducto = (grados) => {
    setProductoConfig((prev) => ({
      ...prev,
      rotation: prev.rotation + grados,
    }));
  };

  const resetearProducto = () => {
    setProductoConfig(buildDefaultConfig(stageSize));
  };

  const cerrarModal = () => {
    if (imagenUsuarioUrl) {
      URL.revokeObjectURL(imagenUsuarioUrl);
    }

    onClose?.();
  };

  return (
    <div className="visualizador-overlay" role="dialog" aria-modal="true">
      <div className="visualizador-modal">
        <div className="visualizador-header">
          <div>
            <h2>Visualizar producto</h2>
            <p>Mira como se veria este producto en tu espacio.</p>
          </div>

          <button type="button" onClick={cerrarModal} className="visualizador-close">
            x
          </button>
        </div>

        <div className="visualizador-producto-info">
          {imagenProducto && (
            <img
              src={getProductImageUrl(producto)}
              alt={getProductName(producto)}
              className="visualizador-producto-thumb"
            />
          )}

          <div>
            <strong>{getProductName(producto)}</strong>
            <div className="visualizador-producto-price">
              {getProductPrice(producto)
                ? `CRC ${getProductPrice(producto).toLocaleString("es-CR")}`
                : "Precio no disponible"}
            </div>
          </div>
        </div>

        <div className="visualizador-content">
          <div className="visualizador-controls">
            <label className="visualizador-upload-button">
              Subir foto del espacio
              <input type="file" accept="image/*" onChange={manejarImagenUsuario} hidden />
            </label>

            {imagenUsuario && (
              <>
                <button
                  type="button"
                  onClick={() => rotarProducto(-15)}
                  aria-label="Rotar -15 grados"
                  title="Rotar -15 grados"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={() => rotarProducto(15)}
                  aria-label="Rotar +15 grados"
                  title="Rotar +15 grados"
                >
                  ↻
                </button>
                <button type="button" onClick={resetearProducto}>
                  Restablecer
                </button>
                <button type="button" onClick={eliminarImagen} className="danger">
                  Cambiar foto
                </button>
              </>
            )}
          </div>

          <div className="visualizador-canvas-container">
            {!imagenUsuario ? (
              <div className="visualizador-empty">
                <h3>Sube una foto de tu espacio</h3>
                <p>Luego podras mover, escalar y rotar el producto.</p>
              </div>
            ) : (
              <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}>
                <Layer>
                  <KonvaImage
                    image={imagenUsuario}
                    x={0}
                    y={0}
                    width={stageSize.width}
                    height={stageSize.height}
                  />

                  {imagenProducto && !cargandoProducto && (
                    <>
                      <KonvaImage
                        ref={productoRef}
                        image={imagenProducto}
                        x={productoConfig.x}
                        y={productoConfig.y}
                        width={productoConfig.width}
                        height={productoConfig.height}
                        rotation={productoConfig.rotation}
                        draggable
                        onMouseDown={() => {
                          if (productoRef.current && transformerRef.current) {
                            transformerRef.current.nodes([productoRef.current]);
                            transformerRef.current.getLayer()?.batchDraw();
                          }
                        }}
                        onTouchStart={() => {
                          if (productoRef.current && transformerRef.current) {
                            transformerRef.current.nodes([productoRef.current]);
                            transformerRef.current.getLayer()?.batchDraw();
                          }
                        }}
                        onDragEnd={manejarMovimiento}
                        onTransformEnd={manejarTransformacion}
                      />

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
                        boundBoxFunc={(oldBox, newBox) => {
                          if (newBox.width < 30 || newBox.height < 30) {
                            return oldBox;
                          }

                          return newBox;
                        }}
                      />
                    </>
                  )}
                </Layer>
              </Stage>
            )}

            {imagenUsuario && !imagenProducto && !cargandoProducto && (
              <div className="visualizador-warning">
                No se pudo cargar la imagen del producto para previsualizar.
              </div>
            )}
          </div>

          {imagenUsuario && (
            <div className="visualizador-instrucciones">
              Arrastra el producto para moverlo. Usa las esquinas para escalarlo.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default VisualizadorProducto;
