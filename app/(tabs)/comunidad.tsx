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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [miId, setMiId] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal crear post
  const [modalCrear, setModalCrear] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
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

  async function handleCrearPost() {
    if (!titulo.trim() || !contenido.trim()) return;
    setCreando(true);
    try {
      await crearPost(titulo.trim(), contenido.trim(), imagenUrl.trim() || undefined);
      setTitulo("");
      setContenido("");
      setImagenUrl("");
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
      <View style={s.header}>
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

      {/* ── MODAL CREAR POST ── */}
      <Modal visible={modalCrear} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>✍️ Nuevo post</Text>
              <TouchableOpacity onPress={() => setModalCrear(false)}>
                <Text style={{ color: "#94a3b8", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

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
              style={[s.input, { height: 100, textAlignVertical: "top" }]}
              placeholder="¿Qué quieres compartir? ✨"
              placeholderTextColor="#4b5563"
              value={contenido}
              onChangeText={setContenido}
              multiline
            />

            <Text style={s.label}>Imagen (URL opcional)</Text>
            <TextInput
              style={s.input}
              placeholder="https://..."
              placeholderTextColor="#4b5563"
              value={imagenUrl}
              onChangeText={setImagenUrl}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[s.btnPublicar, creando && { opacity: 0.6 }]}
              onPress={handleCrearPost}
              disabled={creando}
            >
              <Text style={s.btnPublicarTxt}>
                {creando ? "Publicando..." : "🚀 Publicar"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL DETALLE + COMENTARIOS ── */}
      <Modal visible={modalDetalle} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { maxHeight: "90%" }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>💬 Post</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalDetalle(false);
                  setPostDetalle(null);
                }}
              >
                <Text style={{ color: "#94a3b8", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {cargandoDetalle ? (
              <ActivityIndicator color="#9333ea" style={{ marginVertical: 40 }} />
            ) : postDetalle ? (
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
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
    paddingTop: 56,
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
    borderWidth: 1,
    borderColor: "#1e293b",
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
});