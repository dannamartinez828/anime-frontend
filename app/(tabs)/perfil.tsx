import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { obtenerPerfil, actualizarPerfil } from "./comunidadApi";

// =============================================
// PERFIL
// =============================================

export default function Perfil() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [mostrarInputUrl, setMostrarInputUrl] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const data = await obtenerPerfil();
      setUsername(data.username || "");
      setEmail(data.email || "");
      setFotoPerfil(data.foto_perfil || "");
      setFotoUrl(data.foto_perfil || "");
    } catch {}
    setCargando(false);
  }

  // Elegir de galería
  async function elegirDeGaleria() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso necesario",
        "Necesito acceso a tu galería para elegir una foto."
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      // Usamos la URI local para mostrar preview
      // Para guardarlo en backend necesitarías subir a Cloudinary u otro servicio.
      // Por ahora guardamos la URI como foto_perfil (funciona en la app, no en otros devices)
      const uri = resultado.assets[0].uri;
      setFotoPerfil(uri);
      setFotoUrl(uri);
      setMostrarInputUrl(false);
    }
  }

  // Guardar cambios
  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const datos: { username?: string; foto_perfil?: string } = {};
      if (username.trim()) datos.username = username.trim();
      if (fotoUrl.trim()) datos.foto_perfil = fotoUrl.trim();

      const res = await actualizarPerfil(datos);

      // Actualizar AsyncStorage para que el resto de la app lo vea
      const raw = await AsyncStorage.getItem("@usuario");
      if (raw) {
        const u = JSON.parse(raw);
        await AsyncStorage.setItem(
          "@usuario",
          JSON.stringify({ ...u, ...res.user })
        );
      }

      setMensaje({ tipo: "success", texto: "ヾ(≧▽≦*)o ¡Perfil actualizado! ✨" });
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e.message || "Error al guardar" });
    }
    setGuardando(false);
  }

  // Cerrar sesión
  async function cerrarSesion() {
    Alert.alert("Cerrar sesión", "¿Segura que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("@token");
          await AsyncStorage.removeItem("@usuario");
          router.replace("/login");
        },
      },
    ]);
  }

  if (cargando) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#9333ea" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>👤 Mi Perfil</Text>
      </View>

      {/* Avatar grande */}
      <View style={s.avatarSection}>
        {fotoPerfil ? (
          <Image source={{ uri: fotoPerfil }} style={s.avatarImg} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarLetra}>
              {username?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        {/* Botones para cambiar foto */}
        <View style={s.fotoBtns}>
          <TouchableOpacity style={s.fotoBtn} onPress={elegirDeGaleria}>
            <Text style={s.fotoBtnTxt}>🖼️ Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.fotoBtn}
            onPress={() => setMostrarInputUrl((v) => !v)}
          >
            <Text style={s.fotoBtnTxt}>🔗 URL</Text>
          </TouchableOpacity>
        </View>

        {mostrarInputUrl && (
          <View style={{ width: "100%", marginTop: 10 }}>
            <TextInput
              style={s.inputUrl}
              placeholder="https://imagen.com/mi-foto.jpg"
              placeholderTextColor="#4b5563"
              value={fotoUrl}
              onChangeText={(v) => {
                setFotoUrl(v);
                setFotoPerfil(v);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
      </View>

      {/* Formulario */}
      <View style={s.form}>
        <Text style={s.label}>👤 Nombre de usuario</Text>
        <TextInput
          style={s.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Tu username"
          placeholderTextColor="#4b5563"
        />

        <Text style={s.label}>📧 Correo (no editable)</Text>
        <View style={s.inputDeshabilitado}>
          <Text style={{ color: "#64748b", fontSize: 14 }}>{email}</Text>
        </View>

        {/* Mensaje */}
        {mensaje && (
          <View
            style={[
              s.mensajeBox,
              {
                borderColor: mensaje.tipo === "success" ? "#16a34a" : "#dc2626",
                backgroundColor:
                  mensaje.tipo === "success" ? "#052e16" : "#2d0a0a",
              },
            ]}
          >
            <Text
              style={{
                color: mensaje.tipo === "success" ? "#4ade80" : "#f87171",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {mensaje.texto}
            </Text>
          </View>
        )}

        {/* Botón guardar */}
        <TouchableOpacity
          style={[s.btnGuardar, guardando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          <Text style={s.btnGuardarTxt}>
            {guardando ? "⏳ Guardando..." : "💾 Guardar cambios"}
          </Text>
        </TouchableOpacity>

        {/* Cerrar sesión */}
        <TouchableOpacity style={s.btnSalir} onPress={cerrarSesion}>
          <Text style={s.btnSalirTxt}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#9333ea",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#9333ea",
  },
  avatarLetra: {
    color: "white",
    fontSize: 40,
    fontWeight: "800",
  },
  fotoBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  fotoBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  fotoBtnTxt: {
    color: "#a78bfa",
    fontWeight: "600",
    fontSize: 13,
  },
  inputUrl: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#9333ea",
  },
  form: {
    padding: 24,
  },
  label: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  inputDeshabilitado: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1e293b",
  },
  mensajeBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  btnGuardar: {
    backgroundColor: "#9333ea",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#9333ea",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  btnGuardarTxt: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },
  btnSalir: {
    borderWidth: 1.5,
    borderColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 14,
  },
  btnSalirTxt: {
    color: "#f87171",
    fontWeight: "700",
    fontSize: 14,
  },
});