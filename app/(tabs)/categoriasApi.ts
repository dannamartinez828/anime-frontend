import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

// ================================================
// HELPER: headers con token
// ================================================

async function getAuthHeaders(): Promise<HeadersInit> {

  const token = await AsyncStorage.getItem("@token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

}

// ================================================
// HELPER: parsear respuesta segura
// ================================================

async function parseResponse(res: Response): Promise<any> {

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Error del servidor (status ${res.status})`
    );
  }

}

// ================================================
// CATEGORÍAS
// ================================================

export async function obtenerCategorias(usuarioId: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/${usuarioId}`,
    { headers }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error obteniendo categorías");

  return data;

}

export async function crearCategoria(payload: {
  usuario_id: number;
  nombre: string;
  color: string;
  emoji: string;
}) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error creando categoría");

  return data;

}

export async function editarCategoria(
  id: number,
  payload: { nombre: string; color: string; emoji: string }
) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/${id}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error editando categoría");

  return data;

}

export async function eliminarCategoria(id: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/${id}`,
    { method: "DELETE", headers }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error eliminando categoría");

  return data;

}

// ================================================
// ANIMES DENTRO DE CATEGORÍA
// ================================================

export async function obtenerAnimesDe(categoriaId: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/${categoriaId}/animes`,
    { headers }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error obteniendo animes");

  return data;

}

export async function agregarAnime(
  categoriaId: number,
  payload: {
    titulo: string;
    genero?: string;
    estado?: string;
    descripcion?: string;
    imagen_url?: string;
    nota?: string;
  }
) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/${categoriaId}/animes`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error agregando anime");

  return data;

}

export async function editarAnime(
  animeId: number,
  payload: {
    titulo: string;
    genero?: string;
    estado?: string;
    descripcion?: string;
    imagen_url?: string;
    nota?: string;
  }
) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/animes/${animeId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error editando anime");

  return data;

}

export async function eliminarAnime(animeId: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/categorias/animes/${animeId}`,
    { method: "DELETE", headers }
  );

  const data = await parseResponse(res);

  if (!res.ok) throw new Error(data.error || "Error eliminando anime");

  return data;

}