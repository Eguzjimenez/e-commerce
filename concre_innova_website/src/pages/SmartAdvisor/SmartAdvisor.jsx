import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  RotateCcw,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  buildAdvisorAnswers,
  clearAdvisorAnswers,
  generateAdvisorRecommendations,
  getAdvisorGroupTitle,
  getAdvisorQuestionnaire,
} from "../../services/advisorService";
import { isLoggedIn } from "../../services/authService";
import { addToCart, getCartCount, getCartSubtotal } from "../../services/cartService";
import {
  formatCatalogPrice,
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";
import { PRIVATE_ROUTES } from "../../routes/routes";
import "./SmartAdvisor.css";

const ADVISOR_STAGES = {
  WELCOME: "welcome",
  QUESTIONNAIRE: "questionnaire",
  RESULTS: "results",
};

const PASOS_ASESORIA = [
  {
    titulo: "Cuéntanos del espacio",
    detalle: "Ubicación, luz y tiempo que puedes dedicarle.",
  },
  {
    titulo: "Cruzamos tus respuestas",
    detalle: "Cada respuesta pondera categorías, tipos y características.",
  },
  {
    titulo: "Recibes tu selección",
    detalle: "Plantas y maceteros compatibles, listos para el carrito.",
  },
];

/**
 * El rail muestra una etiqueta corta por pregunta. El codigo del cuestionario
 * ya es un identificador legible ("espacio", "luz"), asi que se reutiliza en
 * lugar de recortar el texto completo de la pregunta.
 */
function getEtiquetaCorta(question, indice) {
  const codigo = String(question?.codigo || "").replace(/[_-]+/g, " ").trim();

  if (!codigo) {
    return `Pregunta ${indice + 1}`;
  }

  return codigo.charAt(0).toUpperCase() + codigo.slice(1);
}

function readCartSummary() {
  return {
    unidades: getCartCount(),
    subtotal: getCartSubtotal(),
  };
}

function SmartAdvisor() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [selectedOptionByQuestionId, setSelectedOptionByQuestionId] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stage, setStage] = useState(ADVISOR_STAGES.WELCOME);
  const [recommendationGroups, setRecommendationGroups] = useState([]);
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(true);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cartSummary, setCartSummary] = useState(readCartSummary);

  useEffect(() => {
    const controller = new AbortController();

    const loadQuestionnaire = async () => {
      setIsLoadingQuestionnaire(true);
      setErrorMessage("");

      try {
        const response = await getAdvisorQuestionnaire({
          signal: controller.signal,
        });
        const nextQuestions = Array.isArray(response?.preguntas)
          ? response.preguntas
          : [];

        // El asesor siempre inicia limpio para que respuestas previas
        // del usuario no interfieran con la nueva consulta.
        setQuestions(nextQuestions);
        setSelectedOptionByQuestionId({});
        setCurrentQuestionIndex(0);
        setRecommendationGroups([]);
        setStage(ADVISOR_STAGES.WELCOME);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          setErrorMessage(
            loadError?.message || "No fue posible cargar el asesor inteligente."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingQuestionnaire(false);
        }
      }
    };

    loadQuestionnaire();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const syncCartSummary = () => setCartSummary(readCartSummary());

    window.addEventListener("cartchange", syncCartSummary);
    return () => window.removeEventListener("cartchange", syncCartSummary);
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasAnsweredCurrentQuestion = Boolean(
    currentQuestion && selectedOptionByQuestionId[currentQuestion.idPregunta]
  );
  const answeredCount = useMemo(
    () =>
      questions.filter(
        (question) => selectedOptionByQuestionId[question.idPregunta]
      ).length,
    [questions, selectedOptionByQuestionId]
  );
  const hasCompletedQuestionnaire =
    totalQuestions > 0 && answeredCount === totalQuestions;
  const totalRecommendations = useMemo(
    () =>
      recommendationGroups.reduce(
        (total, group) => total + (group.productos?.length || 0),
        0
      ),
    [recommendationGroups]
  );

  /** Etiqueta elegida en cada pregunta, para resumirla junto a los resultados. */
  const respuestasElegidas = useMemo(
    () =>
      questions
        .map((question) => {
          const idOpcion = selectedOptionByQuestionId[question.idPregunta];
          const opcion = question.opciones?.find(
            (option) => option.idOpcion === idOpcion
          );

          return opcion
            ? { idPregunta: question.idPregunta, etiqueta: opcion.etiqueta }
            : null;
        })
        .filter(Boolean),
    [questions, selectedOptionByQuestionId]
  );

  const resetQuestionnaireState = useCallback(() => {
    setSelectedOptionByQuestionId({});
    setCurrentQuestionIndex(0);
    setRecommendationGroups([]);
    setErrorMessage("");
  }, []);

  const handleStartQuestionnaire = () => {
    resetQuestionnaireState();
    setStage(ADVISOR_STAGES.QUESTIONNAIRE);
  };

  const handleSelectOption = (idPregunta, idOpcion) => {
    setSelectedOptionByQuestionId((currentAnswers) => ({
      ...currentAnswers,
      [idPregunta]: idOpcion,
    }));
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((index) => Math.max(0, index - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((index) => Math.min(totalQuestions - 1, index + 1));
  };

  /** Solo se permite saltar a preguntas ya visitadas o a la siguiente pendiente. */
  const handleJumpToQuestion = (index) => {
    if (index <= answeredCount) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!hasCompletedQuestionnaire || isGeneratingRecommendations) {
      return;
    }

    setIsGeneratingRecommendations(true);
    setErrorMessage("");

    try {
      const response = await generateAdvisorRecommendations(
        buildAdvisorAnswers(selectedOptionByQuestionId)
      );
      const nextGroups = Array.isArray(response?.grupos) ? response.grupos : [];

      setRecommendationGroups(nextGroups);
      setStage(ADVISOR_STAGES.RESULTS);
    } catch (requestError) {
      setErrorMessage(
        requestError?.message ||
          "No fue posible generar las recomendaciones. Intenta nuevamente."
      );
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const handleRestartQuestionnaire = async () => {
    resetQuestionnaireState();
    setStage(ADVISOR_STAGES.QUESTIONNAIRE);

    if (!isLoggedIn()) {
      return;
    }

    try {
      await clearAdvisorAnswers();
    } catch {
      // Reiniciar la sesion guardada es complementario: el cuestionario
      // local ya quedo limpio y el usuario puede continuar.
    }
  };

  const handleAddRecommendationToCart = async (product) => {
    addToCart(
      {
        idProducto: product.idProducto,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: Number(product.precio) || 0,
        imagen: product.imagen,
        tamano: product.tamano,
        material: product.material,
      },
      1
    );

    const result = await Swal.fire({
      icon: "success",
      title: "Producto agregado",
      text: `${product.nombre} fue agregado al carrito.`,
      showCancelButton: true,
      confirmButtonText: "Ver carrito",
      cancelButtonText: "Seguir explorando",
    });

    if (result.isConfirmed) {
      navigate(PRIVATE_ROUTES.CART);
    }
  };

  const porcentajeAvance = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  return (
    <div className="advisor-page">
      {/* Plano 1: banda de contexto, separada del area de trabajo. */}
      <header className="advisor-hero">
        <div className="advisor-hero-inner container">
          <span className="advisor-eyebrow">
            <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
            Asesor Inteligente
          </span>
          <h1>Encuentra las plantas y maceteros ideales para tu espacio</h1>
          <p>
            Responde unas preguntas sobre tu entorno y recibe recomendaciones
            preparadas para las condiciones de tu hogar u oficina.
          </p>

          {stage !== ADVISOR_STAGES.WELCOME && totalQuestions > 0 && (
            <div className="advisor-hero-progress">
              <div
                className="advisor-progress-bar"
                role="progressbar"
                aria-label="Avance del cuestionario"
                aria-valuemin={0}
                aria-valuemax={totalQuestions}
                aria-valuenow={answeredCount}
              >
                <span style={{ width: `${porcentajeAvance}%` }} />
              </div>
              <span className="advisor-hero-progress-label">
                {answeredCount} de {totalQuestions} respondidas
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="advisor-body container">
        {isLoadingQuestionnaire && (
          <p className="advisor-status">Cargando el asesor...</p>
        )}

        {!isLoadingQuestionnaire && errorMessage && (
          <p className="advisor-error" role="alert">
            {errorMessage}
          </p>
        )}

        {!isLoadingQuestionnaire && !errorMessage && totalQuestions === 0 && (
          <div className="advisor-empty">
            <h2>El asesor no está disponible</h2>
            <p>Vuelve a intentarlo más tarde o explora el catálogo completo.</p>
          </div>
        )}

        {!isLoadingQuestionnaire && totalQuestions > 0 && (
          <>
            {/* Plano 2: presentacion, con los pasos del proceso a la vista. */}
            {stage === ADVISOR_STAGES.WELCOME && (
              <section className="advisor-welcome">
                <article className="advisor-welcome-card">
                  <span className="advisor-welcome-icon" aria-hidden="true">
                    <Leaf size={26} strokeWidth={1.6} />
                  </span>
                  <h2>Bienvenido a tu asesoría personalizada</h2>
                  <p>
                    Son {totalQuestions} preguntas rápidas sobre el espacio, la luz
                    disponible, el tiempo de cuidado y el estilo que prefieres.
                  </p>
                  <button
                    className="btn"
                    type="button"
                    onClick={handleStartQuestionnaire}
                  >
                    Iniciar cuestionario
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </article>

                <ol className="advisor-steps">
                  {PASOS_ASESORIA.map((paso, indice) => (
                    <li className="advisor-step" key={paso.titulo}>
                      <span className="advisor-step-number">{indice + 1}</span>
                      <div>
                        <h3>{paso.titulo}</h3>
                        <p>{paso.detalle}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Plano 3: area de trabajo con rail de navegacion y tarjeta activa. */}
            {stage === ADVISOR_STAGES.QUESTIONNAIRE && currentQuestion && (
              <section className="advisor-workspace">
                <nav className="advisor-rail" aria-label="Preguntas del asesor">
                  <p className="advisor-rail-title">Tu cuestionario</p>
                  <ol>
                    {questions.map((question, indice) => {
                      const respondida = Boolean(
                        selectedOptionByQuestionId[question.idPregunta]
                      );
                      const activa = indice === currentQuestionIndex;
                      const accesible = indice <= answeredCount;

                      return (
                        <li key={question.idPregunta}>
                          <button
                            type="button"
                            className={[
                              "advisor-rail-item",
                              activa ? "is-active" : "",
                              respondida ? "is-done" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => handleJumpToQuestion(indice)}
                            disabled={!accesible}
                            aria-current={activa ? "step" : undefined}
                            title={question.texto}
                          >
                            <span className="advisor-rail-marker" aria-hidden="true">
                              {respondida ? <Check size={13} strokeWidth={3} /> : indice + 1}
                            </span>
                            <span className="advisor-rail-text">
                              {getEtiquetaCorta(question, indice)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </nav>

                <article className="advisor-questionnaire">
                  <span className="advisor-question-step">
                    Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                  </span>

                  <h2 id="advisor-current-question">{currentQuestion.texto}</h2>
                  {currentQuestion.ayuda && (
                    <p className="advisor-question-help">{currentQuestion.ayuda}</p>
                  )}

                  <fieldset
                    className="advisor-options"
                    aria-labelledby="advisor-current-question"
                  >
                    {currentQuestion.opciones?.map((option) => {
                      const isSelected =
                        selectedOptionByQuestionId[currentQuestion.idPregunta] ===
                        option.idOpcion;

                      return (
                        <label
                          key={option.idOpcion}
                          className={`advisor-option ${isSelected ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={`pregunta-${currentQuestion.idPregunta}`}
                            value={option.idOpcion}
                            checked={isSelected}
                            onChange={() =>
                              handleSelectOption(
                                currentQuestion.idPregunta,
                                option.idOpcion
                              )
                            }
                          />
                          <span className="advisor-option-body">
                            <span className="advisor-option-label">
                              {option.etiqueta}
                            </span>
                            {option.descripcion && (
                              <span className="advisor-option-description">
                                {option.descripcion}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>

                  <div className="advisor-questionnaire-actions">
                    <button
                      className="advisor-secondary-button"
                      type="button"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                      Anterior
                    </button>

                    <div className="advisor-questionnaire-actions-main">
                      <button
                        className="advisor-secondary-button"
                        type="button"
                        onClick={handleRestartQuestionnaire}
                        disabled={isGeneratingRecommendations}
                      >
                        <RotateCcw size={17} aria-hidden="true" />
                        Reiniciar Cuestionario
                      </button>

                      {!isLastQuestion && (
                        <button
                          className="btn"
                          type="button"
                          onClick={handleNextQuestion}
                          disabled={!hasAnsweredCurrentQuestion}
                        >
                          Siguiente
                          <ArrowRight size={17} aria-hidden="true" />
                        </button>
                      )}

                      {isLastQuestion && (
                        <button
                          className="btn"
                          type="button"
                          onClick={handleGenerateRecommendations}
                          disabled={
                            !hasCompletedQuestionnaire || isGeneratingRecommendations
                          }
                        >
                          <Sparkles size={17} aria-hidden="true" />
                          {isGeneratingRecommendations
                            ? "Generando..."
                            : "Obtener Recomendaciones"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </section>
            )}

            {stage === ADVISOR_STAGES.RESULTS && (
              <div className="advisor-results">
                <div className="advisor-results-header">
                  <div className="advisor-results-intro">
                    <h2>Tus recomendaciones</h2>
                    <p>
                      {totalRecommendations > 0
                        ? `${totalRecommendations} producto(s) seleccionados para tu espacio.`
                        : "Todavía no hay productos disponibles para estas respuestas."}
                    </p>

                    {respuestasElegidas.length > 0 && (
                      <ul className="advisor-answer-chips">
                        {respuestasElegidas.map((respuesta) => (
                          <li key={respuesta.idPregunta}>{respuesta.etiqueta}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="advisor-results-aside">
                    <div className="advisor-cart-summary" aria-live="polite">
                      <span>Carrito: {cartSummary.unidades} unidad(es)</span>
                      <strong>{formatCatalogPrice(cartSummary.subtotal)}</strong>
                    </div>

                    <button
                      className="advisor-secondary-button"
                      type="button"
                      onClick={handleRestartQuestionnaire}
                    >
                      <RotateCcw size={17} aria-hidden="true" />
                      Reiniciar Cuestionario
                    </button>
                  </div>
                </div>

                {recommendationGroups.map((group) => (
                  <section className="advisor-group" key={group.clasificacion}>
                    <header className="advisor-group-header">
                      <h3>{getAdvisorGroupTitle(group.clasificacion)}</h3>
                      <span>{group.productos?.length || 0} opciones</span>
                    </header>

                    <div className="advisor-recommendation-grid">
                      {group.productos?.map((product) => (
                        <article
                          className="advisor-recommendation-card"
                          key={product.idProducto}
                        >
                          <div className="advisor-recommendation-media">
                            <img
                              src={getCatalogProductImage(product)}
                              alt={product.nombre}
                              onError={(event) =>
                                handleCatalogImageFallback(event, product.imagen)
                              }
                            />
                          </div>

                          <div className="advisor-recommendation-body">
                            <span className="advisor-recommendation-category">
                              {product.nombreCategoria}
                            </span>
                            <h4>{product.nombre}</h4>
                            <p>{product.descripcion}</p>
                            <strong>{formatCatalogPrice(product.precio)}</strong>
                          </div>

                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleAddRecommendationToCart(product)}
                          >
                            <ShoppingCart size={17} aria-hidden="true" />
                            Agregar al carrito
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SmartAdvisor;
