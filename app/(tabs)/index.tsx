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
  SafeAreaView,
  Dimensions,
  StatusBar,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import { buscarPersonaje } from "./api";

import { router } from "expo-router";

const { width } = Dimensions.get("window");

const isDesktop = width > 900;

// ==========================================
// TYPES
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

interface Imagen {
  url: string;
}

interface Personaje {
  nombre: string;
  imagenes?: Imagen[];
  anime?: string;
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
    color: ["#2563eb", "#7c3aed"] as [string, string],
  },

  {
    key: "hunterxhunter",
    label: "Hunter x Hunter",
    emoji: "⚡",
    color: ["#059669", "#65a30d"] as [string, string],
  },

  {
    key: "onepiece",
    label: "One Piece",
    emoji: "🏴‍☠️",
    color: ["#ea580c", "#dc2626"] as [string, string],
  },

  {
    key: "resumen",
    label: "Resumen",
    emoji: "💖",
    color: ["#9333ea", "#ec4899"] as [string, string],
  },

  {
    key: "favoritos",
    label: "Favoritos",
    emoji: "❤️",
    color: ["#db2777", "#9333ea"] as [string, string],
  },
];

// ==========================================
// INITIAL
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
    useState<Personaje | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState<Toast | null>(null);

  const [favoritos, setFavoritos] =
    useState<Personaje[]>([]);

  const [ultimosConsultados, setUltimosConsultados] =
    useState<any[]>(ultimosConsultadosInicial);

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {

    cargarFavoritos();
    cargarUltimosConsultados();

  }, []);

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
  // FAVORITOS
  // ==========================================

  async function cargarFavoritos() {

    try {

      const data =
        await AsyncStorage.getItem(
          "@anime_favoritos"
        );

      if (data) {
        setFavoritos(JSON.parse(data));
      }

    } catch (error) {
      console.log(error);
    }

  }

  async function guardarFavoritos(
    nuevosFavoritos: Personaje[]
  ) {

    try {

      await AsyncStorage.setItem(
        "@anime_favoritos",
        JSON.stringify(nuevosFavoritos)
      );

    } catch (error) {
      console.log(error);
    }

  }

  async function agregarFavorito() {

    if (!personaje) return;

    const existe = favoritos.find(
      (item) =>
        item.nombre === personaje.nombre
    );

    if (existe) {

      showToast(
        "warning",
        "Ya existe",
        "Este personaje ya está en favoritos"
      );

      return;
    }

    const nuevoFavorito = {
      ...personaje,

      anime:
        animeSeleccionado === "saintseiya"
          ? "Saint Seiya"
          : animeSeleccionado === "hunterxhunter"
          ? "Hunter x Hunter"
          : "One Piece",
    };

    const nuevos = [
      ...favoritos,
      nuevoFavorito,
    ];

    setFavoritos(nuevos);

    guardarFavoritos(nuevos);

    showToast(
      "success",
      "Favorito agregado",
      `${personaje.nombre} agregado`
    );

  }

  async function eliminarFavorito(
    nombreEliminar: string
  ) {

    const nuevos =
      favoritos.filter(
        (item) =>
          item.nombre !== nombreEliminar
      );

    setFavoritos(nuevos);

    guardarFavoritos(nuevos);

    showToast(
      "success",
      "Eliminado",
      "Favorito eliminado"
    );

  }

  // ==========================================
  // ULTIMOS
  // ==========================================

  async function cargarUltimosConsultados() {

    try {

      const data =
        await AsyncStorage.getItem(
          "@anime_ultimos"
        );

      if (data) {
        setUltimosConsultados(
          JSON.parse(data)
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

      await AsyncStorage.setItem(
        "@anime_ultimos",
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

    return anime?.color || [
      "#9333ea",
      "#ec4899",
    ];

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

      let personajeEncontrado: Personaje | null = null;

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

    } catch (err: unknown) {

      console.log(err);

      const mensaje =
        err instanceof Error
          ? err.message
          : "Error API";

      setPersonaje(null);

      setError(mensaje);

      showToast(
        "error",
        "Error",
        mensaje
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

      setPersonaje(null);

      setFavoritos([]);

      setNombre("");

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
  // RETURN
  // ==========================================

  return (

    <SafeAreaView style={styles.container}>

      <StatusBar
        barStyle="light-content"
      />

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

    </SafeAreaView>

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

});