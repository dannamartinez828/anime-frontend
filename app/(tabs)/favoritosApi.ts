const BASE_URL =
  "https://anime-backend-production-f190.up.railway.app";

// =======================================
// OBTENER FAVORITOS
// =======================================

export async function obtenerFavoritos(usuarioId: number) {

  const res = await fetch(
    `${BASE_URL}/favoritos/${usuarioId}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

// =======================================
// AGREGAR FAVORITO
// =======================================

export async function agregarFavoritoApi(dataFavorito: any) {

  const res = await fetch(
    `${BASE_URL}/favoritos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dataFavorito)
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

// =======================================
// ELIMINAR FAVORITO
// =======================================

export async function eliminarFavoritoApi(id: number) {

  const res = await fetch(
    `${BASE_URL}/favoritos/${id}`,
    {
      method: "DELETE"
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}