import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getToken() {
  return await AsyncStorage.getItem("@token");
}

// =============================================
// POSTS
// =============================================

export async function obtenerPosts() {
  const res = await fetch(`${BASE_URL}/posts`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener posts");
  return data;
}

export async function obtenerPost(id: number) {
  const res = await fetch(`${BASE_URL}/posts/${id}`);
  const data = await res.json();
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear post");
  return data;
}

export async function eliminarPost(id: number) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar post");
  return data;
}

// =============================================
// COMENTARIOS
// =============================================

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
  const data = await res.json();
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
  const data = await res.json();
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
  const data = await res.json();
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");
  return data;
}