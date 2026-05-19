const APIS: Record<string, string> = {

  saintseiya:
    "https://anime-backend-bbwl.onrender.com/saintseiya/personajes",

  hunterxhunter:
    "https://anime-backend-bbwl.onrender.com/hunterxhunter/personajes",

  onepiece:
    "https://anime-backend-bbwl.onrender.com/onepiece/personajes",

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