// ================================================
// CATEGORIAS.TSX
// Tab: el usuario crea categorías y dentro agrega animes
// ================================================

import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import * as ImagePicker from "expo-image-picker";

import {
  obtenerCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
  obtenerAnimesDe,
  agregarAnime,
  editarAnime,
  eliminarAnime,
} from "./categoriasApi";

const { width } = Dimensions.get("window");
const isDesktop = width > 900;

// ================================================
// PALETA DE COLORES Y EMOJIS PARA CATEGORÍAS
// ================================================

const COLORES = [
  "#9333ea", "#ec4899", "#3b82f6",
  "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#8b5cf6", "#f97316",
];

const EMOJIS = [
  "📁", "⚔️", "🌸", "🔥", "💫",
  "🎌", "👑", "🐉", "✨", "💎",
  "🌙", "⚡", "🏴‍☠️", "🌊", "🎭",
];

const ESTADOS = [
  { label: "Pendiente", value: "pendiente", color: "#f59e0b" },
  { label: "Viendo",    value: "viendo",    color: "#3b82f6" },
  { label: "Completado",value: "completado",color: "#10b981" },
  { label: "Pausado",   value: "pausado",   color: "#ef4444" },
];

// ================================================
// TIPOS
// ================================================

interface Categoria {
  id: number;
  nombre: string;
  color: string;
  emoji: string;
  total_animes: number;
}

interface AnimeItem {
  id: number;
  titulo: string;
  genero?: string;
  estado?: string;
  descripcion?: string;
  imagen_url?: string;
  nota?: string;
}

type ToastType = "success" | "error" | "warning" | "info";

// ================================================
// HELPERS
// ================================================

function colorEstado(estado?: string) {

  const e = ESTADOS.find(x => x.value === estado);

  return e?.color || "#9333ea";

}

function labelEstado(estado?: string) {

  const e = ESTADOS.find(x => x.value === estado);

  return e?.label || estado || "—";

}

// ================================================
// COMPONENTE PRINCIPAL
// ================================================

export default function Categorias() {

  // ── datos ──────────────────────────────────────
  const [usuarioId, setUsuarioId] =
    useState<number | null>(null);

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  // ── vista actual ───────────────────────────────
  // "lista" = ver todas las categorías
  // "detalle" = ver animes de una categoría
  const [vista, setVista] =
    useState<"lista" | "detalle">("lista");

  const [categoriaActiva, setCategoriaActiva] =
    useState<Categoria | null>(null);

  const [animesCategoria, setAnimesCategoria] =
    useState<AnimeItem[]>([]);

  // ── modals ─────────────────────────────────────
  const [modalCategoria, setModalCategoria] =
    useState(false);

  const [modalAnime, setModalAnime] =
    useState(false);

  const [modalDetalleAnime, setModalDetalleAnime] =
    useState(false);

  // ── formulario categoría ───────────────────────
  const [formNombre, setFormNombre] =
    useState("");

  const [formColor, setFormColor] =
    useState(COLORES[0]);

  const [formEmoji, setFormEmoji] =
    useState(EMOJIS[0]);

  const [editandoCategoria, setEditandoCategoria] =
    useState<Categoria | null>(null);

  // ── formulario anime ───────────────────────────
  const [aTitulo, setATitulo] = useState("");
  const [aGenero, setAGenero] = useState("");
  const [aEstado, setAEstado] = useState("pendiente");
  const [aDescripcion, setADescripcion] = useState("");
  const [aImagen, setAImagen] = useState("");
  const [modoImagen, setModoImagen] = useState<"galeria" | "url">("galeria");
  const [aNota, setANota] = useState("");
  const [editandoAnime, setEditandoAnime] =
    useState<AnimeItem | null>(null);

  // ── detalle anime seleccionado ─────────────────
  const [animeViendo, setAnimeViendo] =
    useState<AnimeItem | null>(null);

  // ── toast ──────────────────────────────────────
  const [toast, setToast] =
    useState<{ type: ToastType; msg: string } | null>(null);

  // ── carga ──────────────────────────────────────
  const [cargando, setCargando] =
    useState(false);

  // ================================================
  // INIT
  // ================================================

  useEffect(() => {

    cargarUid();

  }, []);

  useEffect(() => {

    if (usuarioId) cargarCategorias();

  }, [usuarioId]);

  // ================================================
  // UID
  // ================================================

  async function cargarUid() {

    try {

      const raw = await AsyncStorage.getItem("@usuario");

      if (raw) {

        const u = JSON.parse(raw);

        if (u?.id) { setUsuarioId(u.id); return; }

      }

      const token = await AsyncStorage.getItem("@token");

      if (token) {

        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload?.id) setUsuarioId(payload.id);

      }

    } catch (e) {

      console.log("Error uid:", e);

    }

  }

  // ================================================
  // TOAST
  // ================================================

  function showToast(type: ToastType, msg: string) {

    setToast({ type, msg });

    setTimeout(() => setToast(null), 2800);

  }

  // ================================================
  // CATEGORÍAS
  // ================================================

  async function cargarCategorias() {

    if (!usuarioId) return;

    setCargando(true);

    try {

      const data = await obtenerCategorias(usuarioId);

      setCategorias(data);

    } catch (e: any) {

      showToast("error", e.message || "Error cargando categorías");

    } finally {

      setCargando(false);

    }

  }

  function abrirModalCategoria(cat?: Categoria) {

    if (cat) {

      setEditandoCategoria(cat);
      setFormNombre(cat.nombre);
      setFormColor(cat.color);
      setFormEmoji(cat.emoji);

    } else {

      setEditandoCategoria(null);
      setFormNombre("");
      setFormColor(COLORES[0]);
      setFormEmoji(EMOJIS[0]);

    }

    setModalCategoria(true);

  }

  async function guardarCategoria() {

    if (!formNombre.trim()) {

      showToast("warning", "Escribe un nombre para la categoría");

      return;

    }

    try {

      if (editandoCategoria) {

        const actualizada = await editarCategoria(
          editandoCategoria.id,
          { nombre: formNombre.trim(), color: formColor, emoji: formEmoji }
        );

        setCategorias(prev =>
          prev.map(c => c.id === actualizada.id
            ? { ...actualizada, total_animes: c.total_animes }
            : c
          )
        );

        showToast("success", "Categoría actualizada ✨");

      } else {

        const nueva = await crearCategoria({
          usuario_id: usuarioId!,
          nombre: formNombre.trim(),
          color: formColor,
          emoji: formEmoji,
        });

        setCategorias(prev => [
          { ...nueva, total_animes: 0 },
          ...prev,
        ]);

        showToast("success", "Categoría creada ✨");

      }

      setModalCategoria(false);

    } catch (e: any) {

      showToast("error", e.message || "Error guardando categoría");

    }

  }

  async function borrarCategoria(cat: Categoria) {

    try {

      await eliminarCategoria(cat.id);

      setCategorias(prev => prev.filter(c => c.id !== cat.id));

      showToast("success", "Categoría eliminada");

      if (categoriaActiva?.id === cat.id) {

        setVista("lista");
        setCategoriaActiva(null);

      }

    } catch (e: any) {

      showToast("error", e.message || "Error eliminando categoría");

    }

  }

  // ================================================
  // DETALLE CATEGORÍA
  // ================================================

  async function abrirCategoria(cat: Categoria) {

    setCategoriaActiva(cat);

    setVista("detalle");

    setCargando(true);

    try {

      const data = await obtenerAnimesDe(cat.id);

      setAnimesCategoria(data);

    } catch (e: any) {

      showToast("error", e.message || "Error cargando animes");

    } finally {

      setCargando(false);

    }

  }

  // ================================================
  // ANIMES
  // ================================================

  function abrirModalAnime(anime?: AnimeItem) {

    if (anime) {

      setEditandoAnime(anime);
      setATitulo(anime.titulo);
      setAGenero(anime.genero || "");
      setAEstado(anime.estado || "pendiente");
      setADescripcion(anime.descripcion || "");
      setAImagen(anime.imagen_url || "");
      setANota(anime.nota || "");

    } else {

      setEditandoAnime(null);
      setATitulo("");
      setAGenero("");
      setAEstado("pendiente");
      setADescripcion("");
      setAImagen("");
      setANota("");
      setModoImagen("galeria");

    }

    setModalAnime(true);

  }

  // ================================================
  // ELEGIR IMAGEN DE GALERÍA
  // ================================================

  async function elegirDeGaleria() {

    try {

      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        setToast({
          type: "warning",
          msg: "Necesito permiso para acceder a tu galería ✨",
        });
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const asset = resultado.assets[0];
        // Guardamos como base64 data URI para que funcione sin servidor
        const base64 = `data:image/jpeg;base64,${asset.base64}`;
        setAImagen(base64);
      }

    } catch (e) {
      console.log("Error galería:", e);
      setToast({
        type: "error",
        msg: "No se pudo abrir la galería — intenta de nuevo 🌸",
      });
    }

  }

  async function guardarAnime() {

    if (!aTitulo.trim()) {

      showToast("warning", "El título es obligatorio");

      return;

    }

    const payload = {
      titulo: aTitulo.trim(),
      genero: aGenero.trim() || undefined,
      estado: aEstado,
      descripcion: aDescripcion.trim() || undefined,
      imagen_url: aImagen.trim() || undefined,
      nota: aNota.trim() || undefined,
    };

    try {

      if (editandoAnime) {

        const actualizado = await editarAnime(editandoAnime.id, payload);

        setAnimesCategoria(prev =>
          prev.map(a => a.id === actualizado.id ? actualizado : a)
        );

        showToast("success", "Anime actualizado ✨");

      } else {

        const nuevo = await agregarAnime(categoriaActiva!.id, payload);

        setAnimesCategoria(prev => [nuevo, ...prev]);

        // actualizar contador en lista
        setCategorias(prev =>
          prev.map(c =>
            c.id === categoriaActiva!.id
              ? { ...c, total_animes: c.total_animes + 1 }
              : c
          )
        );

        showToast("success", "Anime agregado ✨");

      }

      setModalAnime(false);

    } catch (e: any) {

      showToast("error", e.message || "Error guardando anime");

    }

  }

  async function borrarAnime(anime: AnimeItem) {

    try {

      await eliminarAnime(anime.id);

      setAnimesCategoria(prev => prev.filter(a => a.id !== anime.id));

      setCategorias(prev =>
        prev.map(c =>
          c.id === categoriaActiva!.id
            ? { ...c, total_animes: Math.max(0, c.total_animes - 1) }
            : c
        )
      );

      showToast("success", "Anime eliminado");

    } catch (e: any) {

      showToast("error", e.message || "Error eliminando anime");

    }

  }

  // ================================================
  // RENDER: LISTA DE CATEGORÍAS
  // ================================================

  function renderLista() {

    return (

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={s.headerRow}>

          <Text style={s.titulo}>📚 Mis Categorías</Text>

          <TouchableOpacity
            style={s.btnNuevo}
            onPress={() => abrirModalCategoria()}
          >
            <Text style={s.btnNuevoTxt}>+ Nueva</Text>
          </TouchableOpacity>

        </View>

        {/* VACÍO */}
        {!cargando && categorias.length === 0 && (

          <View style={s.vacioCont}>

            <Text style={s.vacioEmoji}>📂</Text>

            <Text style={s.vacioTxt}>
              Aún no tienes categorías.{"\n"}Crea una para empezar a organizar tus animes.
            </Text>

          </View>

        )}

        {/* GRID */}
        <View style={s.grid}>

          {categorias.map(cat => (

            <TouchableOpacity
              key={cat.id}
              style={[s.catCard, { borderColor: cat.color }]}
              onPress={() => abrirCategoria(cat)}
              activeOpacity={0.8}
            >

              <LinearGradient
                colors={["#140f2d", "#1e1040"]}
                style={s.catCardInner}
              >

                <Text style={s.catEmoji}>{cat.emoji}</Text>

                <Text style={[s.catNombre, { color: cat.color }]}>
                  {cat.nombre}
                </Text>

                <Text style={s.catCount}>
                  {cat.total_animes} anime{cat.total_animes !== 1 ? "s" : ""}
                </Text>

                {/* acciones */}
                <View style={s.catAcciones}>

                  <TouchableOpacity
                    onPress={() => abrirModalCategoria(cat)}
                    style={[s.btnAccion, { backgroundColor: "#1e3a5f" }]}
                  >
                    <Text style={s.btnAccionTxt}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => borrarCategoria(cat)}
                    style={[s.btnAccion, { backgroundColor: "#3b0d0d" }]}
                  >
                    <Text style={s.btnAccionTxt}>🗑️</Text>
                  </TouchableOpacity>

                </View>

              </LinearGradient>

            </TouchableOpacity>

          ))}

        </View>

      </ScrollView>

    );

  }

  // ================================================
  // RENDER: DETALLE CATEGORÍA (lista de animes)
  // ================================================

  function renderDetalle() {

    if (!categoriaActiva) return null;

    return (

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={s.headerRow}>

          <TouchableOpacity
            onPress={() => { setVista("lista"); setCategoriaActiva(null); }}
            style={s.btnVolver}
          >
            <Text style={s.btnVolverTxt}>← Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnNuevo, { backgroundColor: categoriaActiva.color }]}
            onPress={() => abrirModalAnime()}
          >
            <Text style={s.btnNuevoTxt}>+ Agregar anime</Text>
          </TouchableOpacity>

        </View>

        {/* TÍTULO CATEGORÍA */}
        <View style={[s.catHeader, { borderColor: categoriaActiva.color }]}>

          <Text style={s.catHeaderEmoji}>{categoriaActiva.emoji}</Text>

          <Text style={[s.catHeaderNombre, { color: categoriaActiva.color }]}>
            {categoriaActiva.nombre}
          </Text>

          <Text style={s.catHeaderCount}>
            {animesCategoria.length} anime{animesCategoria.length !== 1 ? "s" : ""}
          </Text>

        </View>

        {/* VACÍO */}
        {!cargando && animesCategoria.length === 0 && (

          <View style={s.vacioCont}>

            <Text style={s.vacioEmoji}>🎌</Text>

            <Text style={s.vacioTxt}>
              Esta categoría está vacía.{"\n"}Agrega tu primer anime.
            </Text>

          </View>

        )}

        {/* LISTA DE ANIMES */}
        <View style={s.animeGrid}>

          {animesCategoria.map(anime => (

            <TouchableOpacity
              key={anime.id}
              activeOpacity={0.85}
              onPress={() => { setAnimeViendo(anime); setModalDetalleAnime(true); }}
            >

              <LinearGradient
                colors={["#140f2d", "#1e1040", "#2a0a4a"]}
                style={s.animeCard}
              >

                {/* imagen */}
                {anime.imagen_url ? (

                  <Image
                    source={{ uri: anime.imagen_url }}
                    style={s.animeImg}
                    resizeMode="cover"
                  />

                ) : (

                  <View style={[s.animeImgPlaceholder, { backgroundColor: categoriaActiva.color + "33" }]}>
                    <Text style={{ fontSize: 34 }}>🎌</Text>
                  </View>

                )}

                {/* info */}
                <View style={s.animeInfo}>

                  <Text style={s.animeTitulo} numberOfLines={2}>
                    {anime.titulo}
                  </Text>

                  {anime.genero ? (
                    <Text style={s.animeGenero}>{anime.genero}</Text>
                  ) : null}

                  <View style={[s.estadoBadge, { backgroundColor: colorEstado(anime.estado) + "33", borderColor: colorEstado(anime.estado) }]}>
                    <Text style={[s.estadoTxt, { color: colorEstado(anime.estado) }]}>
                      {labelEstado(anime.estado)}
                    </Text>
                  </View>

                </View>

                {/* acciones */}
                <View style={s.animeAcciones}>

                  <TouchableOpacity
                    onPress={() => abrirModalAnime(anime)}
                    style={[s.btnAccion, { backgroundColor: "#1e3a5f" }]}
                  >
                    <Text style={s.btnAccionTxt}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => borrarAnime(anime)}
                    style={[s.btnAccion, { backgroundColor: "#3b0d0d" }]}
                  >
                    <Text style={s.btnAccionTxt}>🗑️</Text>
                  </TouchableOpacity>

                </View>

              </LinearGradient>

            </TouchableOpacity>

          ))}

        </View>

      </ScrollView>

    );

  }

  // ================================================
  // RENDER PRINCIPAL
  // ================================================

  return (

    <View style={s.container}>

      {/* CONTENIDO */}
      {vista === "lista" ? renderLista() : renderDetalle()}

      {/* TOAST */}
      {toast && (

        <View style={[
          s.toast,
          {
            backgroundColor:
              toast.type === "success" ? "#14532d" :
              toast.type === "error"   ? "#450a0a" :
              toast.type === "warning" ? "#451a03" : "#172554",
            borderColor:
              toast.type === "success" ? "#22c55e" :
              toast.type === "error"   ? "#ef4444" :
              toast.type === "warning" ? "#f59e0b" : "#3b82f6",
          }
        ]}>

          <Text style={s.toastTxt}>{toast.msg}</Text>

        </View>

      )}

      {/* ── MODAL: CREAR / EDITAR CATEGORÍA ── */}
      <Modal
        visible={modalCategoria}
        transparent
        animationType="slide"
      >

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >

          <LinearGradient
            colors={["#111827", "#1e1b4b"]}
            style={s.modalBox}
          >

            <Text style={s.modalTitulo}>
              {editandoCategoria ? "✏️ Editar categoría" : "📁 Nueva categoría"}
            </Text>

            {/* nombre */}
            <Text style={s.modalLabel}>Nombre</Text>

            <TextInput
              placeholder="Ej: Shonen, Favoritos, Pendientes..."
              placeholderTextColor="#6b7280"
              value={formNombre}
              onChangeText={setFormNombre}
              style={s.input}
            />

            {/* emoji */}
            <Text style={s.modalLabel}>Emoji</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >

              {EMOJIS.map(e => (

                <TouchableOpacity
                  key={e}
                  onPress={() => setFormEmoji(e)}
                  style={[
                    s.emojiBtn,
                    formEmoji === e && s.emojiBtnActivo,
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>

              ))}

            </ScrollView>

            {/* color */}
            <Text style={s.modalLabel}>Color</Text>

            <View style={s.colorRow}>

              {COLORES.map(c => (

                <TouchableOpacity
                  key={c}
                  onPress={() => setFormColor(c)}
                  style={[
                    s.colorCircle,
                    { backgroundColor: c },
                    formColor === c && s.colorCircleActivo,
                  ]}
                />

              ))}

            </View>

            {/* preview */}
            <View style={[s.preview, { borderColor: formColor }]}>

              <Text style={{ fontSize: 20 }}>{formEmoji}</Text>

              <Text style={[s.previewNombre, { color: formColor }]}>
                {formNombre || "Mi categoría"}
              </Text>

            </View>

            {/* botones */}
            <View style={s.modalBtns}>

              <TouchableOpacity
                style={s.btnCancelar}
                onPress={() => setModalCategoria(false)}
              >
                <Text style={s.btnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btnGuardar, { backgroundColor: formColor }]}
                onPress={guardarCategoria}
              >
                <Text style={s.btnGuardarTxt}>
                  {editandoCategoria ? "Actualizar" : "Crear"}
                </Text>
              </TouchableOpacity>

            </View>

          </LinearGradient>

        </KeyboardAvoidingView>

      </Modal>

      {/* ── MODAL: CREAR / EDITAR ANIME ── */}
      <Modal
        visible={modalAnime}
        transparent
        animationType="slide"
      >

        <View style={s.overlayAnime}>

          <View style={s.modalAnimeWrap}>

            {/* HEADER con gradiente y color de categoría */}
            <LinearGradient
              colors={[categoriaActiva?.color || "#9333ea", "#0f172a"]}
              style={s.modalAnimeHeader}
            >

              <Text style={s.modalAnimeEmoji}>🎌</Text>

              <Text style={s.modalAnimeTituloHeader}>
                {editandoAnime ? "Editar anime" : "Nuevo anime"}
              </Text>

              <TouchableOpacity
                style={s.modalAnimeCerrarX}
                onPress={() => setModalAnime(false)}
              >
                <Text style={s.modalAnimeCerrarXTxt}>✕</Text>
              </TouchableOpacity>

            </LinearGradient>

            {/* BODY scrollable */}
            <ScrollView
              style={s.modalAnimeBody}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* Título */}
              <Text style={s.modalAnimeLabel}>✏️ Título *</Text>

              <TextInput
                placeholder="Ej: Attack on Titan, Naruto..."
                placeholderTextColor="#4b5563"
                value={aTitulo}
                onChangeText={setATitulo}
                style={s.modalAnimeInput}
              />

              {/* Género */}
              <Text style={s.modalAnimeLabel}>🏷️ Género</Text>

              <TextInput
                placeholder="Ej: Shonen, Isekai, Mecha..."
                placeholderTextColor="#4b5563"
                value={aGenero}
                onChangeText={setAGenero}
                style={s.modalAnimeInput}
              />

              {/* Estado */}
              <Text style={s.modalAnimeLabel}>📊 Estado</Text>

              <View style={s.estadosGrid}>

                {ESTADOS.map(e => (

                  <TouchableOpacity
                    key={e.value}
                    onPress={() => setAEstado(e.value)}
                    style={[
                      s.estadoChip,
                      aEstado === e.value
                        ? { backgroundColor: e.color, borderColor: e.color }
                        : { backgroundColor: "#1f2937", borderColor: "#374151" },
                    ]}
                  >

                    <Text style={[
                      s.estadoChipTxt,
                      { color: aEstado === e.value ? "white" : "#9ca3af" }
                    ]}>
                      {e.label}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

              {/* IMAGEN — selector galería o URL */}
              <Text style={s.modalAnimeLabel}>🖼️ Imagen del anime</Text>

              {/* Toggle galería / URL */}
              <View style={s.imgToggleRow}>

                <TouchableOpacity
                  style={[
                    s.imgToggleBtn,
                    modoImagen === "galeria" && {
                      backgroundColor: categoriaActiva?.color || "#9333ea",
                      borderColor: categoriaActiva?.color || "#9333ea",
                    },
                  ]}
                  onPress={() => setModoImagen("galeria")}
                >
                  <Text style={[
                    s.imgToggleTxt,
                    modoImagen === "galeria" && { color: "white" },
                  ]}>📱 Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.imgToggleBtn,
                    modoImagen === "url" && {
                      backgroundColor: categoriaActiva?.color || "#9333ea",
                      borderColor: categoriaActiva?.color || "#9333ea",
                    },
                  ]}
                  onPress={() => setModoImagen("url")}
                >
                  <Text style={[
                    s.imgToggleTxt,
                    modoImagen === "url" && { color: "white" },
                  ]}>🔗 URL</Text>
                </TouchableOpacity>

              </View>

              {/* MODO GALERÍA */}
              {modoImagen === "galeria" && (

                <TouchableOpacity
                  style={s.btnGaleria}
                  onPress={elegirDeGaleria}
                  activeOpacity={0.8}
                >

                  {aImagen && aImagen.startsWith("data:") ? (

                    <Image
                      source={{ uri: aImagen }}
                      style={s.galeriaImgSelected}
                      resizeMode="cover"
                    />

                  ) : (

                    <View style={s.galeriaPlaceholder}>
                      <Text style={{ fontSize: 36 }}>🖼️</Text>
                      <Text style={s.galeriaPlaceholderTxt}>
                        Toca para elegir de tu galería
                      </Text>
                    </View>

                  )}

                </TouchableOpacity>

              )}

              {/* MODO URL */}
              {modoImagen === "url" && (

                <>

                  <TextInput
                    placeholder="https://imagen.com/poster.jpg"
                    placeholderTextColor="#4b5563"
                    value={aImagen.startsWith("data:") ? "" : aImagen}
                    onChangeText={setAImagen}
                    style={s.modalAnimeInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {aImagen.trim().length > 8 && !aImagen.startsWith("data:") && (

                    <Image
                      source={{ uri: aImagen.trim() }}
                      style={s.modalAnimeImgPreview}
                      resizeMode="cover"
                    />

                  )}

                </>

              )}

              {/* Descripción */}
              <Text style={s.modalAnimeLabel}>📖 Descripción</Text>

              <TextInput
                placeholder="¿De qué trata este anime?"
                placeholderTextColor="#4b5563"
                value={aDescripcion}
                onChangeText={setADescripcion}
                style={[s.modalAnimeInput, s.modalAnimeInputMulti]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Nota personal */}
              <Text style={s.modalAnimeLabel}>💬 Nota personal</Text>

              <TextInput
                placeholder="Lo que quieras recordar sobre este anime..."
                placeholderTextColor="#4b5563"
                value={aNota}
                onChangeText={setANota}
                style={[s.modalAnimeInput, s.modalAnimeInputMulti]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

            </ScrollView>

            {/* FOOTER con botones */}
            <View style={s.modalAnimeBtns}>

              <TouchableOpacity
                style={s.modalAnimeBtnCancelar}
                onPress={() => setModalAnime(false)}
              >
                <Text style={s.modalAnimeBtnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalAnimeBtnGuardar, { backgroundColor: categoriaActiva?.color || "#9333ea" }]}
                onPress={guardarAnime}
              >
                <Text style={s.modalAnimeBtnGuardarTxt}>
                  {editandoAnime ? "💾 Guardar" : "➕ Agregar"}
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

      {/* ── MODAL: DETALLE ANIME ── */}
      <Modal
        visible={modalDetalleAnime}
        transparent
        animationType="fade"
      >

        <View style={s.overlay}>

          <LinearGradient
            colors={["#0f172a", "#1e1b4b", "#2e1065"]}
            style={s.modalDetalle}
          >

            {animeViendo?.imagen_url ? (

              <Image
                source={{ uri: animeViendo.imagen_url }}
                style={s.detalleImg}
                resizeMode="cover"
              />

            ) : (

              <View style={s.detallePlaceholder}>
                <Text style={{ fontSize: 50 }}>🎌</Text>
              </View>

            )}

            <Text style={s.detalleTitulo}>
              {animeViendo?.titulo}
            </Text>

            <View style={[
              s.estadoBadge,
              {
                alignSelf: "center",
                marginBottom: 10,
                backgroundColor: colorEstado(animeViendo?.estado) + "22",
                borderColor: colorEstado(animeViendo?.estado),
              }
            ]}>
              <Text style={[s.estadoTxt, { color: colorEstado(animeViendo?.estado) }]}>
                {labelEstado(animeViendo?.estado)}
              </Text>
            </View>

            {animeViendo?.genero ? (
              <Text style={s.detalleGenero}>🏷️ {animeViendo.genero}</Text>
            ) : null}

            {animeViendo?.descripcion ? (
              <>
                <Text style={s.detalleLabel}>Descripción</Text>
                <Text style={s.detalleTexto}>{animeViendo.descripcion}</Text>
              </>
            ) : null}

            {animeViendo?.nota ? (
              <>
                <Text style={s.detalleLabel}>📝 Nota personal</Text>
                <Text style={s.detalleTexto}>{animeViendo.nota}</Text>
              </>
            ) : null}

            <View style={s.modalBtns}>

              <TouchableOpacity
                style={s.btnCancelar}
                onPress={() => setModalDetalleAnime(false)}
              >
                <Text style={s.btnCancelarTxt}>Cerrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btnGuardar, { backgroundColor: categoriaActiva?.color || "#9333ea" }]}
                onPress={() => {
                  setModalDetalleAnime(false);
                  abrirModalAnime(animeViendo!);
                }}
              >
                <Text style={s.btnGuardarTxt}>✏️ Editar</Text>
              </TouchableOpacity>

            </View>

          </LinearGradient>

        </View>

      </Modal>

    </View>

  );

}

// ================================================
// STYLES
// ================================================

const s = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  titulo: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  btnNuevo: {
    backgroundColor: "#9333ea",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  btnNuevoTxt: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },

  btnVolver: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  btnVolverTxt: {
    color: "#c4b5fd",
    fontSize: 15,
    fontWeight: "bold",
  },

  vacioCont: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },

  vacioEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },

  vacioTxt: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: isDesktop ? "flex-start" : "center",
  },

  catCard: {
    width: isDesktop ? 220 : (width - 50) / 2,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  catCardInner: {
    padding: 16,
    alignItems: "center",
  },

  catEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },

  catNombre: {
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 4,
  },

  catCount: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 12,
  },

  catAcciones: {
    flexDirection: "row",
    gap: 8,
  },

  btnAccion: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  btnAccionTxt: {
    fontSize: 14,
  },

  catHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  catHeaderEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },

  catHeaderNombre: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },

  catHeaderCount: {
    color: "#9ca3af",
    fontSize: 13,
  },

  animeGrid: {
    gap: 12,
  },

  animeCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a1a4a",
  },

  animeImg: {
    width: 70,
    height: 90,
    borderRadius: 12,
    flexShrink: 0,
  },

  animeImgPlaceholder: {
    width: 70,
    height: 90,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  animeInfo: {
    flex: 1,
    gap: 4,
  },

  animeTitulo: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  animeGenero: {
    color: "#a78bfa",
    fontSize: 12,
  },

  estadoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },

  estadoTxt: {
    fontSize: 11,
    fontWeight: "bold",
  },

  animeAcciones: {
    gap: 6,
    flexShrink: 0,
  },

  // ── modals ──

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 16,
  },

  modalBox: {
    borderRadius: 24,
    padding: 22,
    maxHeight: 580,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },

  modalTitulo: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  modalLabel: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 4,
  },

  input: {
    backgroundColor: "#0f172a",
    color: "white",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#312e81",
    fontSize: 14,
  },

  emojiBtn: {
    padding: 8,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  emojiBtnActivo: {
    borderColor: "#9333ea",
    backgroundColor: "#2e1065",
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorCircleActivo: {
    borderColor: "white",
    transform: [{ scale: 1.2 }],
  },

  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    backgroundColor: "#0f172a",
  },

  previewNombre: {
    fontSize: 16,
    fontWeight: "bold",
  },

  modalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  btnCancelar: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#1f2937",
    alignItems: "center",
  },

  btnCancelarTxt: {
    color: "#9ca3af",
    fontWeight: "bold",
  },

  btnGuardar: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },

  btnGuardarTxt: {
    color: "white",
    fontWeight: "bold",
  },

  estadoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },

  estadoBtnTxt: {
    fontWeight: "bold",
    fontSize: 13,
  },

  // ── detalle anime modal ──

  modalDetalle: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#4c1d95",
    maxHeight: 600,
  },

  detalleImg: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 14,
  },

  detallePlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    backgroundColor: "#1e1040",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  detalleTitulo: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  detalleGenero: {
    color: "#a78bfa",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 14,
  },

  detalleLabel: {
    color: "#c4b5fd",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },

  detalleTexto: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },

  // ── image picker ──

  imgToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  imgToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },

  imgToggleTxt: {
    fontWeight: "700",
    fontSize: 14,
    color: "#94a3b8",
  },

  btnGaleria: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#334155",
    borderStyle: "dashed",
  },

  galeriaPlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    gap: 8,
  },

  galeriaPlaceholderTxt: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },

  galeriaImgSelected: {
    width: "100%",
    height: 180,
  },

  // ── toast ──

  toast: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 9999,
  },

  toastTxt: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },

  // ── modal anime rediseñado ──

  overlayAnime: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "flex-end",
  },

  modalAnimeWrap: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  modalAnimeHeader: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  modalAnimeEmoji: {
    fontSize: 26,
  },

  modalAnimeTituloHeader: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },

  modalAnimeCerrarX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalAnimeCerrarXTxt: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  modalAnimeBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  modalAnimeLabel: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  modalAnimeInput: {
    backgroundColor: "#1e293b",
    color: "white",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#334155",
  },

  modalAnimeInputMulti: {
    height: 90,
    paddingTop: 13,
  },

  modalAnimeImgPreview: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    marginTop: 10,
    backgroundColor: "#1e293b",
  },

  estadosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },

  estadoChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },

  estadoChipTxt: {
    fontWeight: "700",
    fontSize: 13,
  },

  modalAnimeBtns: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "#0f172a",
  },

  modalAnimeBtnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  modalAnimeBtnCancelarTxt: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 15,
  },

  modalAnimeBtnGuardar: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  modalAnimeBtnGuardarTxt: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
  },

});