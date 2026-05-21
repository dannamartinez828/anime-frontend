// ==========================================
// IMPORTS
// ==========================================

import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import { buscarPersonaje } from "./api";

import {
  obtenerFavoritos,
  agregarFavoritoApi,
  eliminarFavoritoApi,
} from "./favoritosApi";

import { router } from "expo-router";

import Categorias from "./categorias";

const { width } = Dimensions.get("window");

const isDesktop = width > 900;

// ==========================================
// TIPOS
// ==========================================

type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

interface Toast {
  type: ToastType;
  title: string;
  message: string;
}

// ==========================================
// TOAST
// ==========================================

const toastColors = {
  success: {
    bg: "#EAF3DE",
    border: "#639922",
    text: "#3B6D11",
  },

  error: {
    bg: "#FCEBEB",
    border: "#E24B4A",
    text: "#A32D2D",
  },

  warning: {
    bg: "#FAEEDA",
    border: "#BA7517",
    text: "#854F0B",
  },

  info: {
    bg: "#E6F1FB",
    border: "#378ADD",
    text: "#185FA5",
  },
};

const toastIcons = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "✨",
};

// ==========================================
// TABS
// ==========================================

const animes = [
  {
    key: "saintseiya",
    label: "Saint Seiya",
    emoji: "✨",
    color: ["#2563eb", "#7c3aed"],
  },

  {
    key: "hunterxhunter",
    label: "Hunter x Hunter",
    emoji: "⚡",
    color: ["#059669", "#65a30d"],
  },

  {
    key: "onepiece",
    label: "One Piece",
    emoji: "🏴‍☠️",
    color: ["#ea580c", "#dc2626"],
  },

  {
    key: "resumen",
    label: "Resumen",
    emoji: "💖",
    color: ["#9333ea", "#ec4899"],
  },

  {
    key: "favoritos",
    label: "Favoritos",
    emoji: "❤️",
    color: ["#db2777", "#9333ea"],
  },

  {
    key: "categorias",
    label: "Categorías",
    emoji: "📚",
    color: ["#0891b2", "#6366f1"],
  },
];

// ==========================================
// INICIAL
// ==========================================

const ultimosConsultadosInicial = [
  {
    anime: "Saint Seiya",
    personaje: null,
  },

  {
    anime: "Hunter x Hunter",
    personaje: null,
  },

  {
    anime: "One Piece",
    personaje: null,
  },
];

// ==========================================
// APP
// ==========================================

export default function App() {

  const [animeSeleccionado, setAnimeSeleccionado] =
    useState("saintseiya");

  const [nombre, setNombre] =
    useState("");

  const [personaje, setPersonaje] =
    useState<any>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState<Toast | null>(null);

  const [favoritos, setFavoritos] =
    useState<any[]>([]);

  const [ultimosConsultados, setUltimosConsultados] =
    useState<any[]>(ultimosConsultadosInicial);

  // ID del usuario logueado
  const [usuarioId, setUsuarioId] =
    useState<number | null>(null);

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {

    cargarUsuario();

  }, []);

  // Cuando tengamos el usuarioId, cargamos favoritos y últimos consultados del backend
  useEffect(() => {

    if (usuarioId !== null) {
      cargarFavoritos();
      cargarUltimosConsultados(usuarioId);
    }

  }, [usuarioId]);

  // ==========================================
  // CARGAR USUARIO
  // ==========================================

  async function cargarUsuario() {

    try {

      // Intento directo y prioritario
      const rawDirecto = await AsyncStorage.getItem("@usuario");
      if (rawDirecto && rawDirecto !== "undefined" && rawDirecto !== "null") {
        try {
          const u = JSON.parse(rawDirecto);
          if (u?.id) {
            setUsuarioId(u.id);
            return;
          }
        } catch {}
      }

      // Expo Web puede guardar con prefijo diferente — probar varias keys
      const keys = ["@usuario", "usuario", "@RNCAsyncStorage:@usuario"];

      for (const key of keys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw && raw !== "undefined" && raw !== "null") {
          try {
            const u = JSON.parse(raw);
            if (u?.id) {
              setUsuarioId(u.id);
              return;
            }
          } catch {}
        }
      }

      // Último recurso: leer el token y decodificar el id
      const token = await AsyncStorage.getItem("@token");
      if (token && token !== "undefined") {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.id || payload?.userId || payload?.sub) {
            setUsuarioId(payload.id || payload.userId || payload.sub);
            return;
          }
        } catch {}
      }

    } catch (err) {
      console.log("Error cargando usuario:", err);
    }

  }

  // ==========================================
  // HELPER: leer usuarioId de donde sea
  // ==========================================

  async function obtenerUid(): Promise<number | null> {

    if (usuarioId) return usuarioId;

    // Intentar AsyncStorage con varias keys
    const keys = ["@usuario", "usuario"];
    for (const key of keys) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw && raw !== "undefined" && raw !== "null") {
          const u = JSON.parse(raw);
          if (u?.id) {
            setUsuarioId(u.id);
            return u.id;
          }
        }
      } catch {}
    }

    // Fallback: decodificar JWT
    try {
      const token = await AsyncStorage.getItem("@token");
      if (token && token !== "undefined") {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const id = payload?.id || payload?.userId || payload?.sub;
        if (id) {
          setUsuarioId(id);
          return id;
        }
      }
    } catch {}

    return null;
  }

  // ==========================================
  // TOAST
  // ==========================================

  function showToast(
    type: ToastType,
    title: string,
    message: string
  ) {

    setToast({
      type,
      title,
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);

  }

  // ==========================================
  // FAVORITOS — BACKEND
  // ==========================================

  async function cargarFavoritos() {

    const uid = await obtenerUid();

    if (!uid) return;

    try {

      const data = await obtenerFavoritos(uid);

      // El backend devuelve array de favoritos
      // Normalizamos para que tengan la misma forma que antes
      const normalizados = data.map((item: any) => ({
        ...item,
        // Aseguramos que imagenes sea array de objetos { url }
        imagenes: Array.isArray(item.imagenes)
          ? item.imagenes.map((img: any) =>
              typeof img === "string" ? { url: img } : img
            )
          : [],
        // Guardamos el id del backend para poder eliminar
        _favoritoId: item.id,
      }));

      setFavoritos(normalizados);

    } catch (err) {
      console.log("Error cargando favoritos:", err);
    }

  }

  async function agregarFavorito() {

    if (!personaje) return;

    const uid = await obtenerUid();

    if (!uid) {
      showToast("error", "Error", "No hay sesión activa");
      return;
    }

    // Verificar si ya existe por nombre
    const existe = favoritos.find(
      (item) => item.nombre === personaje.nombre
    );

    if (existe) {
      showToast(
        "warning",
        "Ya existe",
        "Este personaje ya está en favoritos"
      );
      return;
    }

    const nombreAnime =
      animeSeleccionado === "saintseiya"
        ? "Saint Seiya"
        : animeSeleccionado === "hunterxhunter"
        ? "Hunter x Hunter"
        : "One Piece";

    // Preparar data para el backend
    const dataFavorito = {
      usuario_id: uid,
      anime: nombreAnime,
      nombre: personaje.nombre,
      edad: personaje.edad ? String(personaje.edad) : null,
      raza: personaje.raza || null,
      poder: personaje.poder || null,
      categoria: personaje.categoria || null,
      descripcion: personaje.descripcion || null,
      // Guardamos las imagenes como JSONB
      imagenes: personaje.imagenes || [],
    };

    try {

      const respuesta = await agregarFavoritoApi(dataFavorito);

      // Agregar localmente con el id del backend
      const nuevoFavorito = {
        ...dataFavorito,
        _favoritoId: respuesta.id || respuesta.favorito?.id,
        imagenes: Array.isArray(personaje.imagenes)
          ? personaje.imagenes.map((img: any) =>
              typeof img === "string" ? { url: img } : img
            )
          : [],
      };

      setFavoritos((prev) => [...prev, nuevoFavorito]);

      showToast(
        "success",
        "Favorito agregado",
        `${personaje.nombre} guardado ✨`
      );

    } catch (err: any) {

      console.log("Error agregando favorito:", err);

      showToast(
        "error",
        "Error",
        err.message || "No se pudo guardar el favorito"
      );

    }

  }

  async function eliminarFavorito(nombreEliminar: string) {

    // Buscar el favorito para obtener su id del backend
    const favorito = favoritos.find(
      (item) => item.nombre === nombreEliminar
    );

    if (!favorito) return;

    const idBackend = favorito._favoritoId || favorito.id;

    try {

      if (idBackend) {
        await eliminarFavoritoApi(idBackend);
      }

      const nuevos = favoritos.filter(
        (item) => item.nombre !== nombreEliminar
      );

      setFavoritos(nuevos);

      showToast("success", "Eliminado", "Favorito eliminado");

    } catch (err: any) {

      console.log("Error eliminando favorito:", err);

      showToast(
        "error",
        "Error",
        err.message || "No se pudo eliminar el favorito"
      );

    }

  }

  // ==========================================
  // ULTIMOS
  // ==========================================

  async function cargarUltimosConsultados(uid?: number) {

    try {

      const id = uid ?? usuarioId;

      if (!id) return;

      const key = `@anime_ultimos_${id}`;

      const data = await AsyncStorage.getItem(key);

      if (data) {
        setUltimosConsultados(
          JSON.parse(data)
        );
      } else {
        setUltimosConsultados(
          ultimosConsultadosInicial
        );
      }

    } catch (error) {
      console.log(error);
    }

  }

  async function guardarUltimosConsultados(
    nuevos: any[]
  ) {

    try {

      const uid = await obtenerUid();

      if (!uid) return;

      const key = `@anime_ultimos_${uid}`;

      await AsyncStorage.setItem(
        key,
        JSON.stringify(nuevos)
      );

    } catch (error) {
      console.log(error);
    }

  }

  // ==========================================
  // HELPERS
  // ==========================================

  function obtenerPlaceholder() {

    if (animeSeleccionado === "saintseiya") {
      return "✨ Busca un personaje";
    }

    if (animeSeleccionado === "hunterxhunter") {
      return "⚡ Busca un personaje";
    }

    if (animeSeleccionado === "onepiece") {
      return "🏴‍☠️ Busca un personaje";
    }

    return "Buscar personaje";
  }

  function obtenerColoresHero(): [string, string] {

    const anime =
      animes.find(
        (a) =>
          a.key === animeSeleccionado
      );

    return anime?.color as [string, string];

  }

  function obtenerNombreAnime() {

    const anime =
      animes.find(
        (a) =>
          a.key === animeSeleccionado
      );

    return anime?.label || "";

  }

  // ==========================================
  // API
  // ==========================================

  async function consultarApi() {

    try {

      setError("");

      if (nombre.trim() === "") {

        showToast(
          "warning",
          "Atención",
          "Debes escribir un personaje"
        );

        return;
      }

      showToast(
        "info",
        "Consultando API",
        "Buscando personaje..."
      );

      const data =
        await buscarPersonaje(
          animeSeleccionado,
          nombre
        );

      let personajeEncontrado = null;

      if (Array.isArray(data.personaje)) {

        personajeEncontrado =
          data.personaje[0];

      } else if (data.personaje) {

        personajeEncontrado =
          data.personaje;

      } else {

        personajeEncontrado = data;

      }

      if (!personajeEncontrado) {

        throw new Error(
          "No se encontró personaje"
        );

      }

      setPersonaje(personajeEncontrado);

      showToast(
        "success",
        "Personaje encontrado",
        personajeEncontrado.nombre
      );

      const nuevo = {

        anime:
          animeSeleccionado === "saintseiya"
            ? "Saint Seiya"
            : animeSeleccionado === "hunterxhunter"
            ? "Hunter x Hunter"
            : "One Piece",

        personaje: personajeEncontrado,
      };

      setUltimosConsultados((prev) => {

        const copia = [...prev];

        if (
          animeSeleccionado === "saintseiya"
        ) {
          copia[0] = nuevo;
        }

        if (
          animeSeleccionado === "hunterxhunter"
        ) {
          copia[1] = nuevo;
        }

        if (
          animeSeleccionado === "onepiece"
        ) {
          copia[2] = nuevo;
        }

        guardarUltimosConsultados(copia);

        return copia;

      });

    } catch (err: any) {

      console.log(err);

      setPersonaje(null);

      setError(
        err.message ||
        "Error desconocido"
      );

      showToast(
        "error",
        "Error",
        err.message || "Error API"
      );

    }

  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function cerrarSesion() {

    try {

      await AsyncStorage.removeItem(
        "@usuario"
      );

      await AsyncStorage.removeItem("@token");

      setPersonaje(null);

      setFavoritos([]);

      setNombre("");

      setUsuarioId(null);

      setUltimosConsultados(ultimosConsultadosInicial);

      showToast(
        "success",
        "Sesión cerrada",
        "Hasta luego ✨"
      );

      setTimeout(() => {

        router.replace("/login");

      }, 1000);

    } catch (error) {

      console.log(error);

      showToast(
        "error",
        "Error",
        "No se pudo cerrar sesión"
      );

    }

  }

  // ==========================================
  // RESUMEN
  // ==========================================

  function renderResumen() {

    return (

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.resumenTitulo}>
          🌸 Anime Memory Cards 🌸
        </Text>

        <View style={styles.cardsContainer}>

          {ultimosConsultados.map(
            (item, index) => (

              <LinearGradient
                key={index}
                colors={[
                  "#140f2d",
                  "#2a1458",
                  "#4c1d95",
                ]}
                style={styles.cardResumen}
              >

                <Text style={styles.animeTop}>
                  🎌 {item.anime}
                </Text>

                {item.personaje ? (
                  <>

                    {item.personaje?.imagenes?.[0]?.url && (

                      <Image
                        source={{
                          uri:
                            item.personaje.imagenes[0]
                              .url,
                        }}
                        style={styles.fotoMini}
                      />

                    )}

                    <Text style={styles.nombreResumen}>
                      ✨ {item.personaje.nombre}
                    </Text>

                    {/* INFO DEL PERSONAJE */}
                    <View style={styles.infoBox}>

                      {item.personaje.edad ? (
                        <View style={styles.infoFila}>
                          <Text style={styles.infoLabel}>🎂 Edad</Text>
                          <Text style={styles.infoValor}>{item.personaje.edad}</Text>
                        </View>
                      ) : null}

                      {item.personaje.raza ? (
                        <View style={styles.infoFila}>
                          <Text style={styles.infoLabel}>🧬 Raza</Text>
                          <Text style={styles.infoValor}>{item.personaje.raza}</Text>
                        </View>
                      ) : null}

                      {item.personaje.poder ? (
                        <View style={styles.infoFila}>
                          <Text style={styles.infoLabel}>⚡ Poder</Text>
                          <Text style={styles.infoValor}>{item.personaje.poder}</Text>
                        </View>
                      ) : null}

                      {item.personaje.categoria ? (
                        <View style={styles.infoFila}>
                          <Text style={styles.infoLabel}>🏅 Categoría</Text>
                          <Text style={styles.infoValor}>{item.personaje.categoria}</Text>
                        </View>
                      ) : null}

                      {item.personaje.descripcion ? (
                        <View style={styles.infoDescFila}>
                          <Text style={styles.infoLabel}>📖 Descripción</Text>
                          <Text style={styles.infoDesc}>{item.personaje.descripcion}</Text>
                        </View>
                      ) : null}

                    </View>

                    <TouchableOpacity
                      style={styles.btnMini}
                      onPress={() => {

                        setPersonaje(
                          item.personaje
                        );

                        setModalVisible(true);

                      }}
                    >

                      <Text style={styles.textoMini}>
                        🌸 Ver imágenes
                      </Text>

                    </TouchableOpacity>

                  </>
                ) : (

                  <Text style={styles.vacio}>
                    Sin búsquedas todavía
                  </Text>

                )}

              </LinearGradient>

            )
          )}

        </View>

      </ScrollView>

    );

  }

  // ==========================================
  // FAVORITOS
  // ==========================================

  function renderFavoritos() {

    return (

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.resumenTitulo}>
          ❤️ Favoritos ❤️
        </Text>

        {favoritos.length === 0 && (
          <Text style={styles.vacio}>
            Aún no tienes favoritos guardados
          </Text>
        )}

        <View style={styles.cardsContainer}>

          {favoritos.map((item, index) => (

            <LinearGradient
              key={index}
              colors={[
                "#140f2d",
                "#2a1458",
                "#4c1d95",
              ]}
              style={styles.cardResumen}
            >

              <Text style={styles.animeTop}>
                🎌 {item.anime}
              </Text>

              {item?.imagenes?.[0]?.url && (

                <Image
                  source={{
                    uri:
                      item.imagenes[0].url,
                  }}
                  style={styles.fotoMini}
                />

              )}

              <Text style={styles.nombreResumen}>
                ✨ {item.nombre}
              </Text>

              {/* INFO DEL PERSONAJE */}
              <View style={styles.infoBox}>

                {item.edad ? (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>🎂 Edad</Text>
                    <Text style={styles.infoValor}>{item.edad}</Text>
                  </View>
                ) : null}

                {item.raza ? (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>🧬 Raza</Text>
                    <Text style={styles.infoValor}>{item.raza}</Text>
                  </View>
                ) : null}

                {item.poder ? (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>⚡ Poder</Text>
                    <Text style={styles.infoValor}>{item.poder}</Text>
                  </View>
                ) : null}

                {item.categoria ? (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>🏅 Categoría</Text>
                    <Text style={styles.infoValor}>{item.categoria}</Text>
                  </View>
                ) : null}

                {item.descripcion ? (
                  <View style={styles.infoDescFila}>
                    <Text style={styles.infoLabel}>📖 Descripción</Text>
                    <Text style={styles.infoDesc}>{item.descripcion}</Text>
                  </View>
                ) : null}

              </View>

              <TouchableOpacity
                style={styles.btnMini}
                onPress={() => {

                  setPersonaje(item);

                  setModalVisible(true);

                }}
              >

                <Text style={styles.textoMini}>
                  🌸 Ver imágenes
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnEliminar}
                onPress={() =>
                  eliminarFavorito(
                    item.nombre
                  )
                }
              >

                <Text style={styles.textoMini}>
                  🗑️ Eliminar
                </Text>

              </TouchableOpacity>

            </LinearGradient>

          ))}

        </View>

      </ScrollView>

    );

  }

  // ==========================================
  // BUSQUEDA
  // ==========================================

  function renderBusqueda() {

    return (

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 170,
        }}
        showsVerticalScrollIndicator={false}
      >

        <LinearGradient
          colors={obtenerColoresHero()}
          style={styles.hero}
        >

          <Text style={styles.animeSeleccionado}>
            🎌 {obtenerNombreAnime()}
          </Text>

          <Text style={styles.heroTitle}>
            Anime Finder
          </Text>

          <Text style={styles.heroNombre}>
            {nombre || "Personaje Anime"}
          </Text>

        </LinearGradient>

        <View style={styles.searchCard}>

          <Text style={styles.label}>
            🔎 Buscar personaje
          </Text>

          <TextInput
            placeholder={obtenerPlaceholder()}
            placeholderTextColor="#c4b5fd"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={consultarApi}
            style={styles.btnContainer}
          >

            <LinearGradient
              colors={[
                "#ec4899",
                "#9333ea",
              ]}
              style={styles.btn}
            >

              <Text style={styles.textoBoton}>
                ✨ Consultar API
              </Text>

            </LinearGradient>

          </TouchableOpacity>

        </View>

        {personaje && (

          <LinearGradient
            colors={[
              "#111827",
              "#1e1b4b",
              "#312e81",
            ]}
            style={styles.personajeCard}
          >

            <Text style={styles.nombrePrincipal}>
              ✨ {personaje.nombre}
            </Text>

            {/* INFO COMPLETA DEL PERSONAJE */}
            <View style={styles.infoBox}>

              {personaje.edad ? (
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>🎂 Edad</Text>
                  <Text style={styles.infoValor}>{personaje.edad}</Text>
                </View>
              ) : null}

              {personaje.raza ? (
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>🧬 Raza</Text>
                  <Text style={styles.infoValor}>{personaje.raza}</Text>
                </View>
              ) : null}

              {personaje.poder ? (
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>⚡ Poder</Text>
                  <Text style={styles.infoValor}>{personaje.poder}</Text>
                </View>
              ) : null}

              {personaje.categoria ? (
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>🏅 Categoría</Text>
                  <Text style={styles.infoValor}>{personaje.categoria}</Text>
                </View>
              ) : null}

              {personaje.descripcion ? (
                <View style={styles.infoDescFila}>
                  <Text style={styles.infoLabel}>📖 Descripción</Text>
                  <Text style={styles.infoDesc}>{personaje.descripcion}</Text>
                </View>
              ) : null}

            </View>

            <TouchableOpacity
              style={styles.botonImagenes}
              onPress={() =>
                setModalVisible(true)
              }
            >

              <Text style={styles.textoBoton}>
                🌸 Ver imágenes
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnFavorito}
              onPress={agregarFavorito}
            >

              <Text style={styles.textoBoton}>
                ❤️ Guardar favorito
              </Text>

            </TouchableOpacity>

          </LinearGradient>

        )}

      </ScrollView>

    );

  }

  // ==========================================
  // RETURN
  // ==========================================

  return (

    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
      />

      {animeSeleccionado === "resumen"
        ? renderResumen()
        : animeSeleccionado === "favoritos"
        ? renderFavoritos()
        : animeSeleccionado === "categorias"
        ? <Categorias />
        : renderBusqueda()}

      {/* TOAST */}

      {toast && (

        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor:
                toastColors[toast.type].bg,

              borderColor:
                toastColors[toast.type]
                  .border,
            },
          ]}
        >

          <Text style={styles.toastIcon}>
            {toastIcons[toast.type]}
          </Text>

          <View style={styles.toastTextos}>

            <Text
              style={[
                styles.toastTitulo,
                {
                  color:
                    toastColors[toast.type]
                      .text,
                },
              ]}
            >
              {toast.title}
            </Text>

            <Text
              style={[
                styles.toastMensaje,
                {
                  color:
                    toastColors[toast.type]
                      .text,
                },
              ]}
            >
              {toast.message}
            </Text>

          </View>

        </View>

      )}

      {/* MODAL */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >

        <View style={styles.overlay}>

          <LinearGradient
            colors={[
              "#111827",
              "#312e81",
              "#581c87",
            ]}
            style={styles.modalBox}
          >

            <Text style={styles.modalTitulo}>
              🌸 Anime Gallery 🌸
            </Text>

            <FlatList
              data={
                personaje?.imagenes || []
              }
              keyExtractor={(
                item,
                index
              ) => index.toString()}
              numColumns={2}
              style={{ maxHeight: isDesktop ? 340 : undefined }}
              renderItem={({ item }) => (

                <Image
                  source={{
                    uri: typeof item === "string" ? item : item.url,
                  }}
                  style={styles.imagen}
                />

              )}
            />

            <TouchableOpacity
              style={styles.cerrarBtn}
              onPress={() =>
                setModalVisible(false)
              }
            >

              <Text style={styles.textoBoton}>
                ✨ Cerrar
              </Text>

            </TouchableOpacity>

          </LinearGradient>

        </View>

      </Modal>

      {/* TABS */}

      <View style={styles.tabs}>

        {animes.map((anime) => (

          <TouchableOpacity
            key={anime.key}
            style={[
              styles.tab,

              animeSeleccionado ===
                anime.key &&
                styles.tabActiva,
            ]}
            onPress={() => {

              setAnimeSeleccionado(
                anime.key
              );

              setPersonaje(null);

              setNombre("");

              setError("");

            }}
          >

            <Text style={styles.tabEmoji}>
              {anime.emoji}
            </Text>

            <Text style={styles.tabTexto}>
              {anime.label}
            </Text>

          </TouchableOpacity>

        ))}

        <TouchableOpacity
          style={styles.logoutTab}
          onPress={cerrarSesion}
        >

          <Text style={styles.tabEmoji}>
            🚪
          </Text>

          <Text style={styles.tabTexto}>
            Salir
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#050816",
  },

  hero: {
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
  },

  animeSeleccionado: {
    color: "#fde68a",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  heroTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
  },

  heroNombre: {
    color: "#fbcfe8",
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
  },

  searchCard: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: "#111827",
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "#7e22ce",
  },

  label: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 12,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    color: "white",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#9333ea",
  },

  btnContainer: {
    marginTop: 22,
    borderRadius: 22,
    overflow: "hidden",
  },

  btn: {
    padding: 16,
    alignItems: "center",
  },

  textoBoton: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  personajeCard: {
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },

  nombrePrincipal: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  botonImagenes: {
    backgroundColor: "#ec4899",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 20,
  },

  btnFavorito: {
    backgroundColor: "#db2777",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 12,
  },

  resumenTitulo: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 20,
  },

  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 15,
  },

  cardResumen: {
    width:
      isDesktop
        ? 380
        : width - 30,

    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#7e22ce",
  },

  animeTop: {
    color: "#f9a8d4",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },

  fotoMini: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 12,
  },

  nombreResumen: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  vacio: {
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },

  btnMini: {
    backgroundColor: "#ec4899",
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 12,
    alignItems: "center",
  },

  btnEliminar: {
    backgroundColor: "#ef4444",
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },

  // ── info personaje ──

  infoBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },

  infoFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  infoDescFila: {
    paddingVertical: 4,
  },

  infoLabel: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 0,
    marginRight: 8,
  },

  infoValor: {
    color: "#f3f4f6",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  infoDesc: {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  textoMini: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },

  overlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: isDesktop ? 320 : "85%",
    maxHeight: "75vh" as any,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#9333ea",
  },

  modalTitulo: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  imagen: {
    width: isDesktop ? 130 : (width - 110) / 2,
    height: isDesktop ? 130 : (width - 110) / 2,
    borderRadius: 16,
    margin: 4,
  },

  cerrarBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 15,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    flexShrink: 0,
    ...(Platform.OS === "web"
      ? {
          position: "fixed" as any,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }
      : {}),
  },

  tab: {
    flex: 1,
    backgroundColor: "#1e293b",
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
  },

  tabActiva: {
    backgroundColor: "#9333ea",
  },

  logoutTab: {
    backgroundColor: "#dc2626",
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  tabEmoji: {
    fontSize: 18,
  },

  tabTexto: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },

  toastContainer: {
    position: "absolute",
    top: 60,
    left: 18,
    right: 18,
    zIndex: 9999,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  toastIcon: {
    fontSize: 20,
    marginTop: 1,
  },

  toastTextos: {
    flex: 1,
  },

  toastTitulo: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 2,
  },

  toastMensaje: {
    fontSize: 13,
  },

});