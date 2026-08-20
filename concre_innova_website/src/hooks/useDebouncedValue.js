import { useEffect, useState } from "react";

/**
 * Devuelve el valor solo despues de que deje de cambiar durante `retardoMs`.
 *
 * Los buscadores del panel consultaban el API en cada tecla: cada pulsacion
 * disparaba una peticion y su ciclo de carga, y la pantalla se sentia trabada
 * mientras se escribia. Con este retardo se escribe con normalidad y la
 * consulta sale una sola vez, cuando la persona termina de teclear.
 */
export function useDebouncedValue(valor, retardoMs = 350) {
  const [valorDiferido, setValorDiferido] = useState(valor);

  useEffect(() => {
    // El primer valor y el texto vacio no necesitan espera: se aplican ya.
    if (valor === valorDiferido) {
      return undefined;
    }

    const temporizador = window.setTimeout(
      () => setValorDiferido(valor),
      String(valor ?? "").trim() ? retardoMs : 0
    );

    return () => window.clearTimeout(temporizador);
  }, [valor, valorDiferido, retardoMs]);

  return valorDiferido;
}

export default useDebouncedValue;
