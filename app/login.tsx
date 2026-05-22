import React, {
  useState,
  useRef,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import { login } from "./authApi";

import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// =============================================
// VALIDACIÓN DE EMAIL
// =============================================

function validarEmail(email: string): string | null {

  const tieneArroba = email.includes("@");
  const tienePunto = email.includes(".");

  if (!tieneArroba) {
    return "¡Uy! ˚₊‧꒰ა 📧 ໒꒱ ‧₊˚  Ese correo no tiene @ — ¿lo revisas? No te borro lo que escribiste 🌸";
  }

  if (!tienePunto) {
    return "¡Casi! ٩(◕‿◕｡)۶  Al correo le falta un punto (como .com o .co) — intenta de nuevo 💫";
  }

  const partes = email.split("@");
  if (partes.length !== 2 || partes[0] === "" || partes[1] === "") {
    return "˚˖𓍢ִ໋🌷͙֒✧˚. Ese correo no se ve válido todavía — revisa que tenga algo antes y después del @ 🌼";
  }

  return null;

}

// =============================================
// TOAST COMPONENT
// =============================================

type ToastTipo = "success" | "error" | "warning" | "info" | null;

interface ToastProps {
  tipo: ToastTipo;
  mensaje: string;
  onClose: () => void;
}

function Toast({ tipo, mensaje, onClose }: ToastProps) {

  if (!tipo) return null;

  const config = {
    success: {
      bg: "#052e16",
      border: "#16a34a",
      textColor: "#4ade80",
      emoji: "✅",
    },
    error: {
      bg: "#2d0a0a",
      border: "#dc2626",
      textColor: "#f87171",
      emoji: "❌",
    },
    warning: {
      bg: "#2d1a00",
      border: "#f59e0b",
      textColor: "#fbbf24",
      emoji: "⚠️",
    },
    info: {
      bg: "#0c1a3a",
      border: "#3b82f6",
      textColor: "#93c5fd",
      emoji: "💫",
    },
  }[tipo];

  return (

    <View style={[
      s.toast,
      {
        backgroundColor: config.bg,
        borderColor: config.border,
      }
    ]}>

      <Text style={s.toastEmoji}>
        {config.emoji}
      </Text>

      <Text style={[s.toastMensaje, { color: config.textColor }]}>
        {mensaje}
      </Text>

      <TouchableOpacity
        onPress={onClose}
        style={s.toastX}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[s.toastXTxt, { color: config.textColor }]}>✕</Text>
      </TouchableOpacity>

    </View>

  );

}

// =============================================
// LOGIN
// =============================================

export default function Login() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [presionado, setPresionado] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [toast, setToast] = useState<{
    tipo: ToastTipo;
    mensaje: string;
  }>({ tipo: null, mensaje: "" });

  const scaleBtn = useRef(new Animated.Value(1)).current;

  function cerrarToast() {
    setToast({ tipo: null, mensaje: "" });
  }

  function onEmailChange(texto: string) {
    setEmail(texto);
    if (emailError) {
      // Revalida en tiempo real para limpiar el error cuando corrija
      const err = validarEmail(texto);
      if (!err) setEmailError("");
    }
  }

  function onEmailBlur() {
    if (email.trim() !== "") {
      const err = validarEmail(email.trim());
      if (err) setEmailError(err);
      else setEmailError("");
    }
  }

  function animarBtn() {
    Animated.sequence([
      Animated.timing(scaleBtn, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleBtn, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handleLogin() {

    animarBtn();

    setToast({ tipo: null, mensaje: "" });

    if (!email || !password) {
      setToast({
        tipo: "warning",
        mensaje: "˚₊‧꒰ა 🌸 ໒꒱‧₊˚  ¡Espera! Necesito que llenes todos los campos para poder entrar ✨",
      });
      return;
    }

    const errEmail = validarEmail(email.trim());
    if (errEmail) {
      setEmailError(errEmail);
      return;
    }

    setPresionado(true);

    try {

      const data = await login(email.trim(), password);

      await AsyncStorage.setItem("@token", data.token);
      await AsyncStorage.setItem("@usuario", JSON.stringify(data.user));

      const nombreUsuario = data.user?.nombre || data.user?.name || data.user?.username || "";

      setToast({
        tipo: "success",
        mensaje: `ヾ(≧▽≦*)o  ¡Bienvenid@ de vuelta${nombreUsuario ? ", " + nombreUsuario : ""}! Tu sesión se inició correctamente 🌟✨`,
      });

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1600);

    } catch (err: any) {

      const msg: string = err.message || "";

      if (
        msg.toLowerCase().includes("no encontrado") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("credenciales") ||
        msg.toLowerCase().includes("wrong")
      ) {
        setToast({
          tipo: "error",
          mensaje: "(╥_╥)  Hmm, no encontré esa cuenta o la contraseña no es correcta,revisa la información porfavor — ¿lo intentamos denuevo? 💭",
        });
      } else {
        setToast({
          tipo: "error",
          mensaje: `(>_<)  (╥_╥)  Hmm, no encontré esa cuenta o la contraseña no es correcta  ${msg} — intenta en un momento 🌙`,
        });
      }

    } finally {
      setPresionado(false);
    }

  }

  return (

    <View style={s.container}>

      {/* TOAST */}
      <Toast
        tipo={toast.tipo}
        mensaje={toast.mensaje}
        onClose={cerrarToast}
      />

      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.headerEmoji}>✨</Text>
        <Text style={s.headerTitle}>Iniciar sesión</Text>
        <Text style={s.headerSub}>
          ¡Qué bueno verte! (｡♥‿♥｡)
        </Text>
      </View>

      {/* FORM */}
      <View style={s.form}>

        {/* EMAIL */}
        <Text style={s.label}>📧 Correo electrónico</Text>

        <TextInput
          placeholder="tucorreo@ejemplo.com"
          placeholderTextColor="#4b5563"
          style={[
            s.input,
            emailError ? s.inputError : {},
            email && !emailError ? s.inputOk : {},
          ]}
          value={email}
          onChangeText={onEmailChange}
          onBlur={onEmailBlur}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />

        {emailError ? (
          <Text style={s.emailErrorTxt}>{emailError}</Text>
        ) : null}

        {/* PASSWORD */}
        <Text style={s.label}>🔒 Contraseña</Text>

        <View style={s.inputWrapper}>

          <TextInput
            placeholder="Tu contraseña secreta ✨"
            placeholderTextColor="#4b5563"
            style={s.inputInner}
            secureTextEntry={!verPassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={() => setVerPassword(v => !v)}
            style={s.ojito}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.ojitoTxt}>
              {verPassword ? "(◕‿◕✿)" : "(＞﹏＜)"}
            </Text>
          </TouchableOpacity>

        </View>

        {/* BOTÓN ENTRAR */}
        <Animated.View style={{ transform: [{ scale: scaleBtn }], marginTop: 20 }}>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={presionado}
          >

            <LinearGradient
              colors={presionado ? ["#581c87", "#1e1b4b"] : ["#9333ea", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btnPrincipal}
            >

              <Text style={s.btnPrincipalTxt}>
                {presionado ? "⏳ Entrando..." : "🚀 ¡Entrar!"}
              </Text>

            </LinearGradient>

          </TouchableOpacity>

        </Animated.View>

        {/* LINK REGISTRO */}
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={s.linkContainer}
          activeOpacity={0.7}
        >

          <Text style={s.linkTxt}>
            ¿No tienes cuenta aún?{"  "}
            <Text style={s.linkAccion}>Créala aquí ✨</Text>
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}

// =============================================
// STYLES
// =============================================

const s = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#050816",
    justifyContent: "center",
    padding: 24,
  },

  // ── toast ──

  toast: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  toastEmoji: {
    fontSize: 22,
    flexShrink: 0,
    marginTop: 1,
  },

  toastMensaje: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },

  toastX: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  toastXTxt: {
    fontSize: 13,
    fontWeight: "bold",
  },

  // ── header ──

  header: {
    alignItems: "center",
    marginBottom: 36,
  },

  headerEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },

  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },

  headerSub: {
    color: "#a78bfa",
    fontSize: 15,
    fontWeight: "500",
  },

  // ── form ──

  form: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  label: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: "#334155",
    fontSize: 15,
  },

  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#1a0a0a",
  },

  inputOk: {
    borderColor: "#16a34a",
  },

  emailErrorTxt: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    lineHeight: 18,
    paddingHorizontal: 4,
  },

  // ── input con ojito ──

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#334155",
    marginBottom: 6,
    paddingRight: 4,
  },

  inputInner: {
    flex: 1,
    color: "white",
    padding: 14,
    fontSize: 15,
  },

  ojito: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  ojitoTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#a78bfa",
    letterSpacing: 0.5,
  },

  // ── botones ──

  btnPrincipal: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#9333ea",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },

  btnPrincipalTxt: {
    color: "white",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.5,
  },

  linkContainer: {
    marginTop: 18,
    alignItems: "center",
  },

  linkTxt: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
  },

  linkAccion: {
    color: "#a78bfa",
    fontWeight: "700",
  },

});