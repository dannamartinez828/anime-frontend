import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

// =======================================
// HELPER: headers con token
// =======================================

async function getAuthHeaders(): Promise<HeadersInit> {

  const token = await AsyncStorage.getItem("@token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

}

// =======================================
// OBTENER FAVORITOS
// =======================================

export async function obtenerFavoritos(usuarioId: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/favoritos/${usuarioId}`,
    { headers }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.detail);
  }

  return data;
}

// =======================================
// AGREGAR FAVORITO
// =======================================

export async function agregarFavoritoApi(dataFavorito: any) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/favoritos`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(dataFavorito)
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.detail);
  }

  return data;
}

// =======================================
// ELIMINAR FAVORITO
// =======================================

export async function eliminarFavoritoApi(id: number) {

  const headers = await getAuthHeaders();

  const res = await fetch(
    `${BASE_URL}/favoritos/${id}`,
    {
      method: "DELETE",
      headers,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.detail);
  }

  return data;
}