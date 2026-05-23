import AsyncStorage from "@react-native-async-storage/async-storage";

// Sin barra al final — evita el doble slash que causa HTML de error
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

async function getToken() {
  return await AsyncStorage.getItem("@token");
}

// Parseo seguro — evita "Unexpected token '<'" cuando el server devuelve HTML
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `El servidor devolvió una respuesta inesperada (${res.status}). Verifica que el backend esté activo.`
    );
  }
}

// =============================================
// POSTS
// =============================================

export async function obtenerPosts() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al obtener posts");
  return data;
}

export async function obtenerPost(id: number) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al obtener post");
  return data;
}

export async function crearPost(
  titulo: string,
  contenido: string,
  imagen_url?: string
) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ titulo, contenido, imagen_url }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al crear post");
  return data;
}

export async function eliminarPost(id: number) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al eliminar post");
  return data;
}

// =============================================
// COMENTARIOS
// =============================================

export async function obtenerComentarios(postId: number) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts/${postId}/comentarios`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al obtener comentarios");
  return data;
}

export async function comentar(postId: number, contenido: string) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts/${postId}/comentarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contenido }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al comentar");
  return data;
}

export async function eliminarComentario(postId: number, comentarioId: number) {
  const token = await getToken();
  const res = await fetch(
    `${BASE_URL}/posts/${postId}/comentarios/${comentarioId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al eliminar comentario");
  return data;
}

// =============================================
// PERFIL
// =============================================

export async function obtenerPerfil() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al obtener perfil");
  return data;
}

export async function actualizarPerfil(datos: {
  username?: string;
  foto_perfil?: string;
}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/perfil`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");
  return data;
}