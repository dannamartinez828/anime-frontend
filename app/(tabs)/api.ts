const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

const APIS: Record<string, string> = {
  saintseiya:
    `${BASE_URL}/saintseiya/personajes`,

  hunterxhunter:
    `${BASE_URL}/hunterxhunter/personajes`,

  onepiece:
    `${BASE_URL}/onepiece/personajes`,
};

export async function buscarPersonaje(
  anime: string,
  nombre: string
) {

  try {

    const baseUrl = APIS[anime];

    if (!baseUrl) {

      throw new Error(
        "Anime no válido"
      );

    }

    const response = await fetch(
      `${baseUrl}/buscar?nombre=${encodeURIComponent(nombre)}`
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error || "Error al consultar API"
      );

    }

    return data;

  } catch (error: any) {

    throw new Error(
      error.message || "Error desconocido"
    );

  }

}

export default function Api() {
  return null;
}