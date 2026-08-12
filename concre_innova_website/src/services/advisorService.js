import { request } from "./apiClient";

export const ADVISOR_CLASSIFICATIONS = {
  PLANT: "Planta",
  PLANTER: "Macetero",
};

const ADVISOR_GROUP_TITLES = {
  [ADVISOR_CLASSIFICATIONS.PLANT]: "Plantas recomendadas",
  [ADVISOR_CLASSIFICATIONS.PLANTER]: "Maceteros recomendados",
};

export function getAdvisorGroupTitle(classification) {
  return ADVISOR_GROUP_TITLES[classification] || "Productos recomendados";
}

export function buildAdvisorAnswers(selectedOptionIdByQuestionId) {
  return Object.entries(selectedOptionIdByQuestionId || {})
    .filter(([, idOpcion]) => Number(idOpcion) > 0)
    .map(([idPregunta, idOpcion]) => ({
      idPregunta: Number(idPregunta),
      idOpcion: Number(idOpcion),
    }));
}

export function getAdvisorQuestionnaire({ signal } = {}) {
  return request("/api/Asesor/cuestionario", {
    method: "GET",
    signal,
  });
}

export function generateAdvisorRecommendations(respuestas, { signal } = {}) {
  return request("/api/Asesor/recomendaciones", {
    method: "POST",
    body: {
      respuestas: Array.isArray(respuestas) ? respuestas : [],
    },
    signal,
  });
}

export function clearAdvisorAnswers() {
  return request("/api/Asesor/respuestas", {
    method: "DELETE",
  });
}
