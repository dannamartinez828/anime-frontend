import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;
import * as ImagePicker from "expo-image-picker";
import {
  obtenerPosts,
  obtenerPost,
  crearPost,
  eliminarPost,
  comentar,
  eliminarComentario,
} from "./comunidadApi";

// =============================================
// TIPOS
// =============================================

interface Post {
  id: number;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  created_at: string;
  usuario_id: number;
  username: string;
  foto_perfil?: string;
  total_comentarios: number;
}

interface Comentario {
  id: number;
  contenido: string;
  created_at: string;
  usuario_id: number;
  username: string;
  foto_perfil?: string;
}

interface PostDetalle extends Post {
  comentarios: Comentario[];
}

// =============================================
// AVATAR
// =============================================

function Avatar({
  foto,
  username,
  size = 36,
}: {
  foto?: string;
  username: string;
  size?: number;
}) {
  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#1e293b",
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#7c3aed",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "800", fontSize: size * 0.4 }}>
        {username?.[0]?.toUpperCase() || "?"}
      </Text>
    </View>
  );
}

// =============================================
// CARD DE POST
// =============================================

function PostCard({
  post,
  miId,
  onPress,
  onDelete,
}: {
  post: Post;
  miId: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const fecha = new Date(post.created_at).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={s.cardHeader}>
        <Avatar foto={post.foto_perfil} username={post.username} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardUsername}>@{post.username}</Text>
          <Text style={s.cardFecha}>{fecha}</Text>
        </View>
        {post.usuario_id === miId && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.btnEliminarTxt}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido */}
      <Text style={s.cardTitulo}>{post.titulo}</Text>
      <Text style={s.cardContenido} numberOfLines={3}>
        {post.contenido}
      </Text>

      {/* Imagen opcional */}
      {post.imagen_url ? (
        <Image
          source={{ uri: post.imagen_url }}
          style={s.cardImagen}
          resizeMode="cover"
        />
      ) : null}

      {/* Footer */}
      <View style={s.cardFooter}>
        <Text style={s.cardComentarios}>
          💬 {post.total_comentarios}{" "}
          {Number(post.total_comentarios) === 1 ? "comentario" : "comentarios"}
        </Text>
        <Text style={s.cardVerMas}>Ver más →</Text>
      </View>
    </TouchableOpacity>
  );
}

// =============================================
// PANTALLA PRINCIPAL
// =============================================

export default function Comunidad() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [miId, setMiId] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal crear post
  const [modalCrear, setModalCrear] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [imagenLocal, setImagenLocal] = useState<string | null>(null); // URI local elegida con picker
  const [modoImagen, setModoImagen] = useState<"url" | "galeria">("galeria"); // qué modo está activo
  const [creando, setCreando] = useState(false);

  // Modal detalle post
  const [postDetalle, setPostDetalle] = useState<PostDetalle | null>(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    cargarMiId();
    cargarPosts();
  }, []);

  async function cargarMiId() {
    try {
      const raw = await AsyncStorage.getItem("@usuario");
      if (raw) {
        const u = JSON.parse(raw);
        setMiId(u.id);
      }
    } catch {}
  }

  async function cargarPosts() {
    try {
      const data = await obtenerPosts();
      setPosts(data);
    } catch {}
    setCargando(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarPosts();
    setRefreshing(false);
  }, []);

  async function abrirDetalle(id: number) {
    setModalDetalle(true);
    setCargandoDetalle(true);
    try {
      const data = await obtenerPost(id);
      setPostDetalle(data);
    } catch {}
    setCargandoDetalle(false);
  }

  // ─────────────────────────────────────────
  // IMAGE PICKER — abrir galería del dispositivo
  // ─────────────────────────────────────────

  async function abrirGaleria() {
    // Pedir permiso solo en nativo (en web no hace falta)
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("(´• ω •`) Necesitamos permiso para acceder a tu galería");
        return;
      }
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true, // necesitamos base64 para subir al backend
    });

    if (!resultado.canceled && resultado.assets[0]) {
      const asset = resultado.assets[0];
      setImagenLocal(asset.uri);

      // Convertir a base64 data URI para preview y envío
      if (asset.base64) {
        const mime = asset.mimeType || "image/jpeg";
        const dataUri = `data:${mime};base64,${asset.base64}`;
        // Guardamos el dataUri en imagenUrl para enviarlo al backend como imagen_url
        // (el backend puede guardar la URL o el base64 según su configuración)
        setImagenUrl(dataUri);
      } else {
        // Fallback: usar la URI directamente
        setImagenUrl(asset.uri);
      }
    }
  }

  function limpiarImagen() {
    setImagenLocal(null);
    setImagenUrl("");
  }

  // ─────────────────────────────────────────
  // CREAR POST
  // ─────────────────────────────────────────

  async function handleCrearPost() {
    if (!titulo.trim() || !contenido.trim()) return;
    setCreando(true);
    try {
      const urlFinal = imagenUrl.trim() || undefined;
      await crearPost(titulo.trim(), contenido.trim(), urlFinal);
      setTitulo("");
      setContenido("");
      setImagenUrl("");
      setImagenLocal(null);
      setModoImagen("galeria");
      setModalCrear(false);
      await cargarPosts();
    } catch (e: any) {
      alert(e.message);
    }
    setCreando(false);
  }

  async function handleEliminarPost(id: number) {
    try {
      await eliminarPost(id);
      await cargarPosts();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleComentar() {
    if (!nuevoComentario.trim() || !postDetalle) return;
    setEnviandoComentario(true);
    try {
      const nuevo = await comentar(postDetalle.id, nuevoComentario.trim());
      setPostDetalle((prev) =>
        prev ? { ...prev, comentarios: [...prev.comentarios, nuevo] } : prev
      );
      setNuevoComentario("");
      // Actualizar contador en lista
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postDetalle.id
            ? { ...p, total_comentarios: Number(p.total_comentarios) + 1 }
            : p
        )
      );
    } catch (e: any) {
      alert(e.message);
    }
    setEnviandoComentario(false);
  }

  async function handleEliminarComentario(comentarioId: number) {
    if (!postDetalle) return;
    try {
      await eliminarComentario(postDetalle.id, comentarioId);
      setPostDetalle((prev) =>
        prev
          ? {
              ...prev,
              comentarios: prev.comentarios.filter((c) => c.id !== comentarioId),
            }
          : prev
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postDetalle.id
            ? { ...p, total_comentarios: Math.max(0, Number(p.total_comentarios) - 1) }
            : p
        )
      );
    } catch (e: any) {
      alert(e.message);
    }
  }

  // ── RENDER ──────────────────────────────────

  if (cargando) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#9333ea" size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: Math.max(insets.top + 12, 24) }]}>
        <View>
          <Text style={s.headerTitle}>✨ Comunidad</Text>
          <Text style={s.headerSub}>Comparte tu amor por el anime</Text>
        </View>
        <TouchableOpacity
          style={s.btnNuevo}
          onPress={() => setModalCrear(true)}
          activeOpacity={0.8}
        >
          <Text style={s.btnNuevoTxt}>＋ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333ea"
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🌸</Text>
            <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 15 }}>
              Todavía no hay posts
            </Text>
            <Text style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
              ¡Sé el primero en publicar!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            miId={miId}
            onPress={() => abrirDetalle(item.id)}
            onDelete={() => handleEliminarPost(item.id)}
          />
        )}
      />

      {/* ══════════════════════════════════════════
          MODAL CREAR POST  (con image picker ✨)
      ══════════════════════════════════════════ */}
      <Modal visible={modalCrear} animationType="slide" transparent statusBarTranslucent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>✍️ Nuevo post</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalCrear(false);
                  limpiarImagen();
                  setModoImagen("galeria");
                }}
              >
                <Text style={{ color: "#94a3b8", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Text style={s.label}>Título</Text>
            <TextInput
              style={s.input}
              placeholder="Dale un título a tu post..."
              placeholderTextColor="#4b5563"
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={s.label}>Contenido</Text>
            <TextInput
              style={[s.input, { height: 90, textAlignVertical: "top" }]}
              placeholder="¿Qué quieres compartir? ✨"
              placeholderTextColor="#4b5563"
              value={contenido}
              onChangeText={setContenido}
              multiline
            />

            {/* ─── SECCIÓN IMAGEN ─── */}
            <Text style={s.label}>Imagen (opcional)</Text>

            {/* Toggle URL / Galería */}
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, modoImagen === "galeria" && s.toggleActivo]}
                onPress={() => {
                  setModoImagen("galeria");
                  setImagenUrl("");
                }}
              >
                <Text style={[s.toggleTxt, modoImagen === "galeria" && s.toggleTxtActivo]}>
                  🖼️ Galería
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, modoImagen === "url" && s.toggleActivo]}
                onPress={() => {
                  setModoImagen("url");
                  limpiarImagen();
                }}
              >
                <Text style={[s.toggleTxt, modoImagen === "url" && s.toggleTxtActivo]}>
                  🔗 URL
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─── MODO GALERÍA ─── */}
            {modoImagen === "galeria" && (
              <View>
                {imagenLocal ? (
                  <View style={s.previewContainer}>
                    <Image
                      source={{ uri: imagenLocal }}
                      style={s.previewImagen}
                      resizeMode="cover"
                    />
                    <TouchableOpacity style={s.btnQuitarImagen} onPress={limpiarImagen}>
                      <Text style={s.btnQuitarTxt}>✕ Quitar imagen</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={s.btnGaleria} onPress={abrirGaleria}>
                    <Text style={s.btnGaleriaEmoji}>(◕‿◕✿)</Text>
                    <Text style={s.btnGaleriaTxt}>Elegir imagen de la galería</Text>
                    <Text style={s.btnGaleriaSub}>Toca para abrir tus fotos</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ─── MODO URL ─── */}
            {modoImagen === "url" && (
              <TextInput
                style={s.input}
                placeholder="https://..."
                placeholderTextColor="#4b5563"
                value={imagenUrl}
                onChangeText={setImagenUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            )}

            {/* Preview de URL si tiene contenido */}
            {modoImagen === "url" && imagenUrl.trim().startsWith("http") && (
              <Image
                source={{ uri: imagenUrl.trim() }}
                style={[s.previewImagen, { marginTop: 10 }]}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity
              style={[s.btnPublicar, creando && { opacity: 0.6 }]}
              onPress={handleCrearPost}
              disabled={creando}
            >
              <Text style={s.btnPublicarTxt}>
                {creando ? "Publicando..." : "🚀 Publicar"}
              </Text>
            </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL DETALLE + COMENTARIOS ── */}
      <Modal visible={modalDetalle} animationType="slide" transparent={false} statusBarTranslucent>
        <View style={s.detalleContainer}>
          <View style={[s.detalleTopBar]}>
            <TouchableOpacity
              style={s.detalleVolverBtn}
              onPress={() => {
                setModalDetalle(false);
                setPostDetalle(null);
              }}
            >
              <Text style={s.detalleVolverTxt}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.modalTitulo}>💬 Post</Text>
            <View style={{ width: 70 }} />
          </View>

            {cargandoDetalle ? (
              <ActivityIndicator color="#9333ea" style={{ marginVertical: 40 }} />
            ) : postDetalle ? (
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
                  {/* Post completo */}
                  <View style={s.detalleHeader}>
                    <Avatar
                      foto={postDetalle.foto_perfil}
                      username={postDetalle.username}
                    />
                    <Text style={[s.cardUsername, { marginLeft: 10 }]}>
                      @{postDetalle.username}
                    </Text>
                  </View>
                  <Text style={s.detalleTitulo}>{postDetalle.titulo}</Text>
                  <Text style={s.detalleContenido}>{postDetalle.contenido}</Text>
                  {postDetalle.imagen_url ? (
                    <Image
                      source={{ uri: postDetalle.imagen_url }}
                      style={s.detalleImagen}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Comentarios */}
                  <Text style={s.seccionTitulo}>
                    Comentarios ({postDetalle.comentarios.length})
                  </Text>

                  {postDetalle.comentarios.length === 0 ? (
                    <Text style={s.sinComentarios}>
                      Sé el primero en comentar 🌸
                    </Text>
                  ) : (
                    postDetalle.comentarios.map((c) => (
                      <View key={c.id} style={s.comentarioCard}>
                        <Avatar foto={c.foto_perfil} username={c.username} size={28} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={s.comentarioUsername}>@{c.username}</Text>
                          <Text style={s.comentarioTexto}>{c.contenido}</Text>
                        </View>
                        {c.usuario_id === miId && (
                          <TouchableOpacity
                            onPress={() => handleEliminarComentario(c.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={{ fontSize: 14 }}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Input comentar */}
                <View style={s.comentarBar}>
                  <TextInput
                    style={s.comentarInput}
                    placeholder="Escribe un comentario... ✨"
                    placeholderTextColor="#4b5563"
                    value={nuevoComentario}
                    onChangeText={setNuevoComentario}
                  />
                  <TouchableOpacity
                    style={[
                      s.btnEnviar,
                      (!nuevoComentario.trim() || enviandoComentario) && {
                        opacity: 0.4,
                      },
                    ]}
                    onPress={handleComentar}
                    disabled={!nuevoComentario.trim() || enviandoComentario}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      {enviandoComentario ? "..." : "→"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : null}
        </View>
      </Modal>
    </View>
  );
}

// =============================================
// ESTILOS
// =============================================

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSub: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  btnNuevo: {
    backgroundColor: "#9333ea",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  btnNuevoTxt: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardUsername: {
    color: "#a78bfa",
    fontWeight: "700",
    fontSize: 13,
  },
  cardFecha: {
    color: "#475569",
    fontSize: 11,
    marginTop: 2,
  },
  cardTitulo: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },
  cardContenido: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  cardImagen: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  cardComentarios: {
    color: "#64748b",
    fontSize: 12,
  },
  cardVerMas: {
    color: "#9333ea",
    fontSize: 12,
    fontWeight: "600",
  },
  btnEliminarTxt: {
    fontSize: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: "#1e293b",
    height: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 13,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  // Toggle URL / Galería
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  toggleActivo: {
    backgroundColor: "#4c1d95",
    borderColor: "#9333ea",
  },
  toggleTxt: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 13,
  },
  toggleTxtActivo: {
    color: "white",
  },

  // Botón galería (cuando no hay imagen)
  btnGaleria: {
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#7c3aed",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    gap: 4,
  },
  btnGaleriaEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  btnGaleriaTxt: {
    color: "#a78bfa",
    fontWeight: "700",
    fontSize: 14,
  },
  btnGaleriaSub: {
    color: "#475569",
    fontSize: 12,
    marginTop: 2,
  },

  // Preview imagen elegida
  previewContainer: {
    gap: 8,
  },
  previewImagen: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },
  btnQuitarImagen: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  btnQuitarTxt: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 13,
  },

  btnPublicar: {
    backgroundColor: "#9333ea",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  btnPublicarTxt: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },

  // Detalle
  detalleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detalleTitulo: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 8,
  },
  detalleContenido: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  detalleImagen: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 16,
  },
  seccionTitulo: {
    color: "#c4b5fd",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  sinComentarios: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  comentarioCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  comentarioUsername: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  comentarioTexto: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
  },
  comentarBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    marginTop: 8,
  },
  comentarInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    color: "white",
    padding: 12,
    borderRadius: 20,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  btnEnviar: {
    backgroundColor: "#9333ea",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Detalle pantalla completa
  detalleContainer: {
    flex: 1,
    backgroundColor: "#050816",
  },
  detalleTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingBottom: 14,
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  detalleVolverBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    width: 70,
  },
  detalleVolverTxt: {
    color: "#a78bfa",
    fontWeight: "700",
    fontSize: 13,
  },
});