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
// TIPOS TOAST
// ==========================================

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  type: ToastType;
  title: string;
  message: string;
}

const toastColors: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: "#EAF3DE", border: "#639922", text: "#3B6D11" },
  error:   { bg: "#FCEBEB", border: "#E24B4A", text: "#A32D2D" },
  warning: { bg: "#FAEEDA", border: "#BA7517", text: "#854F0B" },
  info:    { bg: "#E6F1FB", border: "#378ADD", text: "#185FA5" },
};

const toastIcons: Record<ToastType, string> = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "✨",
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
];

// ==========================================
// ESTADO INICIAL DE ÚLTIMOS CONSULTADOS
// ==========================================

const ultimosConsultadosInicial = [
  { anime: "Saint Seiya",     personaje: null },
  { anime: "Hunter x Hunter", personaje: null },
  { anime: "One Piece",       personaje: null },
];

export default function App() {

  const [animeSeleccionado, setAnimeSeleccionado] =
    useState("saintseiya");

  const [nombre, setNombre] = useState("");

  const [personaje, setPersonaje] =
    useState<any>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // TOAST
  // ==========================================

  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(
    type: ToastType,
    title: string,
    message: string
  ) {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 3000);
  }

  // ==========================================
  // FAVORITOS
  // ==========================================

  const [favoritos, setFavoritos] =
    useState<any[]>([]);

  useEffect(() => {
    cargarFavoritos();
    cargarUltimosConsultados(); // ← carga resumen al iniciar
  }, []);

  async function cargarFavoritos() {
    try {
      const data = await AsyncStorage.getItem("@anime_favoritos");
      if (data) setFavoritos(JSON.parse(data));
    } catch (error) {
      console.log(error);
    }
  }

  async function guardarFavoritos(nuevosFavoritos: any[]) {
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
      (item) => item.nombre === personaje.nombre
    );

    if (existe) {
      showToast("warning", "Ya existe", "Este personaje ya está en favoritos");
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

    const nuevos = [...favoritos, nuevoFavorito];
    setFavoritos(nuevos);
    guardarFavoritos(nuevos);

    showToast("success", "Favorito agregado", `${personaje.nombre} fue agregado a favoritos`);
  }

  async function eliminarFavorito(nombreEliminar: string) {
    const nuevos = favoritos.filter((item) => item.nombre !== nombreEliminar);
    setFavoritos(nuevos);
    guardarFavoritos(nuevos);
    showToast("success", "Eliminado", "Favorito eliminado correctamente");
  }

  // ==========================================
  // ÚLTIMOS CONSULTADOS — con persistencia
  // ==========================================

  const [ultimosConsultados, setUltimosConsultados] =
    useState<any[]>(ultimosConsultadosInicial);

  async function cargarUltimosConsultados() {
    try {
      const data = await AsyncStorage.getItem("@anime_ultimos");
      if (data) setUltimosConsultados(JSON.parse(data));
    } catch (error) {
      console.log(error);
    }
  }

  async function guardarUltimosConsultados(nuevos: any[]) {
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
  // PLACEHOLDER
  // ==========================================

  function obtenerPlaceholder() {
    if (animeSeleccionado === "saintseiya")    return "✨ Busca un personaje de Saint Seiya";
    if (animeSeleccionado === "hunterxhunter") return "⚡ Busca un personaje de Hunter x Hunter";
    if (animeSeleccionado === "onepiece")      return "🏴‍☠️ Busca un personaje de One Piece";
    return "Buscar personaje...";
  }

  // ==========================================
  // HERO COLORS
  // ==========================================

  function obtenerColoresHero(): [string, string] {
    const anime = animes.find((a) => a.key === animeSeleccionado);
    return anime?.color as [string, string];
  }

  // ==========================================
  // NOMBRE ANIME
  // ==========================================

  function obtenerNombreAnime() {
    const anime = animes.find((a) => a.key === animeSeleccionado);
    return anime?.label || "";
  }

  // ==========================================
  // API
  // ==========================================

  async function consultarApi() {
  try {
    setError("");

    if (nombre.trim() === "") {
      showToast("warning", "Atención", "Debes escribir un personaje");
      return;
    }

    showToast("info", "Consultando API", "Buscando personaje...");

    const data = await buscarPersonaje(animeSeleccionado, nombre);

    // 🔥 AQUÍ ESTABA EL ERROR
    const personajeEncontrado = data.personaje[0];

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

      if (animeSeleccionado === "saintseiya")
        copia[0] = nuevo;

      if (animeSeleccionado === "hunterxhunter")
        copia[1] = nuevo;

      if (animeSeleccionado === "onepiece")
        copia[2] = nuevo;

      guardarUltimosConsultados(copia);

      return copia;
    });

  } catch (err: any) {
    setPersonaje(null);
    setError(err.message);

    showToast("error", "Error", err.message);
  }
}

 // ==========================================
  // CERRAR SESION
  // ==========================================

  async function cerrarSesion() {
  try {

    // elimina sesión
    await AsyncStorage.removeItem("@usuario");

    // opcional limpiar estados
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
  // RESUMEN
  // ==========================================

  function renderResumen() {
    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resumenTitulo}>🌸 Anime Memory Cards 🌸</Text>

        <View style={styles.cardsContainer}>
          {ultimosConsultados.map((item, index) => (
            <LinearGradient
              key={index}
              colors={["#140f2d", "#2a1458", "#4c1d95"]}
              style={styles.cardResumen}
            >
              <View style={styles.glow} />

              <Text style={styles.animeTop}>🎌 {item.anime}</Text>

              {item.personaje ? (
                <>
                  {item.personaje.imagenes?.[0] && (
                    <Image
  source={{ uri: item.personaje.imagenes[0]?.url }}
  style={styles.fotoMini}
/>
                  )}

                  <Text style={styles.nombreResumen}>✨ {item.personaje.nombre}</Text>
                  <Text style={styles.infoResumen}>🎂 Edad: {item.personaje.edad}</Text>
                  <Text style={styles.infoResumen}>👤 Raza: {item.personaje.raza}</Text>
                  <Text style={styles.infoResumen}>⚔️ Poder: {item.personaje.poder}</Text>
                  <Text style={styles.infoResumen}>📚 Categoría: {item.personaje.categoria}</Text>
                  <Text style={styles.infoResumen}>📝 {item.personaje.descripcion}</Text>

                  <TouchableOpacity
                    style={styles.btnMini}
                    onPress={() => {
                      setPersonaje(item.personaje);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.textoMini}>🌸 Ver imágenes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.vacio}>Sin búsquedas todavía</Text>
              )}
            </LinearGradient>
          ))}
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
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resumenTitulo}>❤️ Favoritos ❤️</Text>

        <View style={styles.cardsContainer}>
          {favoritos.map((item, index) => (
            <LinearGradient
              key={index}
              colors={["#140f2d", "#2a1458", "#4c1d95"]}
              style={styles.cardResumen}
            >
              <View style={styles.glow} />

              <Text style={styles.animeTop}>🎌 {item.anime}</Text>

              {item.imagenes?.[0] && (
                <Image
  source={{ uri: item.imagenes[0]?.url }}
  style={styles.fotoMini}
/>
              )}

              <Text style={styles.nombreResumen}>✨ {item.nombre}</Text>
              <Text style={styles.infoResumen}>🎂 Edad: {item.edad}</Text>
              <Text style={styles.infoResumen}>👤 Raza: {item.raza}</Text>
              <Text style={styles.infoResumen}>⚔️ Poder: {item.poder}</Text>
              <Text style={styles.infoResumen}>📚 Categoría: {item.categoria}</Text>
              <Text style={styles.infoResumen}>📝 {item.descripcion}</Text>

              <TouchableOpacity
                style={styles.btnMini}
                onPress={() => {
                  setPersonaje(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.textoMini}>🌸 Ver imágenes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnEliminar}
                onPress={() => eliminarFavorito(item.nombre)}
              >
                <Text style={styles.textoMini}>🗑️ Eliminar</Text>
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
        contentContainerStyle={{ paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <LinearGradient colors={obtenerColoresHero()} style={styles.hero}>
          <Text style={styles.animeSeleccionado}>🎌 {obtenerNombreAnime()}</Text>
          <Text style={styles.heroEmoji}>✨⚡🏴‍☠️</Text>
          <Text style={styles.heroTitle}>Anime Finder</Text>
          <Text style={styles.heroNombre}>{nombre || "Personaje Anime"}</Text>
        </LinearGradient>

        <View style={styles.searchCard}>
          <Text style={styles.label}>🔎 Buscar personaje</Text>

          <TextInput
            placeholder={obtenerPlaceholder()}
            placeholderTextColor="#c4b5fd"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
          />

          <TouchableOpacity onPress={consultarApi} style={styles.btnContainer}>
            <LinearGradient colors={["#ec4899", "#9333ea"]} style={styles.btn}>
              <Text style={styles.textoBoton}>✨ Consultar API</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {personaje && (
          <LinearGradient
            colors={["#111827", "#1e1b4b", "#312e81"]}
            style={styles.personajeCard}
          >
            <Text style={styles.animeTopGrande}>🎌 {obtenerNombreAnime()}</Text>
            <Text style={styles.nombrePrincipal}>✨ {personaje.nombre}</Text>
            <View style={styles.linea} />

            <View style={styles.infoBox}><Text style={styles.info}>🎂 Edad: {personaje.edad}</Text></View>
            <View style={styles.infoBox}><Text style={styles.info}>👤 Raza: {personaje.raza}</Text></View>
            <View style={styles.infoBox}><Text style={styles.info}>⚔️ Poder: {personaje.poder}</Text></View>
            <View style={styles.infoBox}><Text style={styles.info}>📚 Categoría: {personaje.categoria}</Text></View>
            <View style={styles.infoBox}><Text style={styles.info}>📝 {personaje.descripcion}</Text></View>

            <TouchableOpacity
              style={styles.botonImagenes}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.textoBoton}>🌸 Ver imágenes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnFavorito} onPress={agregarFavorito}>
              <Text style={styles.textoBoton}>❤️ Guardar favorito</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />


      {animeSeleccionado === "resumen"
        ? renderResumen()
        : animeSeleccionado === "favoritos"
        ? renderFavoritos()
        : renderBusqueda()}

      {/* TOAST */}
      {toast && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor: toastColors[toast.type].bg,
              borderColor: toastColors[toast.type].border,
            },
          ]}
        >
          <Text style={styles.toastIcon}>{toastIcons[toast.type]}</Text>
          <View style={styles.toastTextos}>
            <Text style={[styles.toastTitulo, { color: toastColors[toast.type].text }]}>
              {toast.title}
            </Text>
            <Text style={[styles.toastMensaje, { color: toastColors[toast.type].text }]}>
              {toast.message}
            </Text>
          </View>
        </View>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <LinearGradient
            colors={["#111827", "#312e81", "#581c87"]}
            style={styles.modalBox}
          >
            <Text style={styles.modalTitulo}>🌸 Anime Gallery 🌸</Text>

            <FlatList
              data={personaje?.imagenes || []}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Image source={{ uri: item.url }} style={styles.imagen} />
              )}
            />

            <TouchableOpacity
              style={styles.cerrarBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoBoton}>✨ Cerrar</Text>
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
        animeSeleccionado === anime.key && styles.tabActiva
      ]}
      onPress={() => {
        setAnimeSeleccionado(anime.key);
        setPersonaje(null);
        setNombre("");
        setError("");
      }}
    >
      <Text style={styles.tabEmoji}>{anime.emoji}</Text>
      <Text style={styles.tabTexto}>{anime.label}</Text>
    </TouchableOpacity>
  ))}

  {/* BOTON CERRAR SESION */}
  <TouchableOpacity
    style={styles.logoutTab}
    onPress={cerrarSesion}
  >
    <Text style={styles.tabEmoji}>🚪</Text>
    <Text style={styles.tabTexto}>Salir</Text>
  </TouchableOpacity>

</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#050816",
  },

  // ==========================================
  // TOAST STYLES
  // ==========================================

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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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

  // ==========================================

  animeSeleccionado: {
    color: "#fde68a",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  heroNombre: {
    color: "#fbcfe8",
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
  },

  animeTop: {
    color: "#f9a8d4",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },

  animeTopGrande: {
    color: "#f9a8d4",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
  },

  vacio: {
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },

  fotoMini: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 12,
  },

  btnMini: {
    backgroundColor: "#ec4899",
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 12,
    alignItems: "center",
  },

  textoMini: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },

  btnEliminar: {
    backgroundColor: "#ef4444",
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },

  btnFavorito: {
    backgroundColor: "#db2777",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 12,
  },

  circle1: {
    position: "absolute",
    width: 250,
    height: 250,
    backgroundColor: "#9333ea",
    borderRadius: 999,
    top: -60,
    left: -80,
    opacity: 0.15,
  },

  circle2: {
    position: "absolute",
    width: 220,
    height: 220,
    backgroundColor: "#ec4899",
    borderRadius: 999,
    bottom: 150,
    right: -70,
    opacity: 0.12,
  },

  hero: {
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
  },

  heroEmoji: {
    fontSize: 34,
    marginBottom: 10,
  },

  heroTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
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

  linea: {
    height: 1,
    backgroundColor: "#7e22ce",
    marginBottom: 20,
  },

  infoBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  info: {
    color: "#f3f4f6",
    fontSize: 16,
  },

  botonImagenes: {
    backgroundColor: "#ec4899",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 20,
  },

  cardsContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 16,
  paddingHorizontal: 15,
},

  cardResumen: {
    width: isDesktop ? 380 : "100%",
    maxWidth: "100%",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#7e22ce",
    overflow: "hidden",
    minHeight: 320,
  },

  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    backgroundColor: "#ec4899",
    borderRadius: 999,
    opacity: 0.12,
    top: -40,
    right: -40,
  },

  resumenTitulo: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 20,
  },

  nombreResumen: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  infoResumen: {
    color: "#f3f4f6",
    marginBottom: 6,
    fontSize: 12,
    textAlign: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: isDesktop ? 430 : "92%",
    borderRadius: 30,
    padding: 20,
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
    width: isDesktop ? 175 : (width - 100) / 2,
    height: isDesktop ? 175 : (width - 100) / 2,
    borderRadius: 22,
    margin: 5,
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
  },

  tab: {
    flex: 1,
    backgroundColor: "#1e293b",
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
  },

  logoutTab: {
  backgroundColor: "#dc2626",
  marginHorizontal: 4,
  borderRadius: 18,
  paddingVertical: 10,
  alignItems: "center",
  paddingHorizontal: 12,
},

  tabActiva: {
    backgroundColor: "#9333ea",
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

  
});
