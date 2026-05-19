import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { login } from "./authApi";

import { useRouter } from "expo-router";

export default function Login() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [tipoMensaje, setTipoMensaje] =
    useState<"error" | "success" | "">("");

  async function handleLogin() {

    try {

      setMensaje("");
      setTipoMensaje("");

      // validar campos
      if (!email || !password) {

        setTipoMensaje("error");

        setMensaje(
          "Todos los campos son obligatorios"
        );

        return;
      }

      const data =
  await login(
    email,
    password
  );

      // guardar token
      await AsyncStorage.setItem(
        "@token",
        data.token
      );

      // guardar usuario
      await AsyncStorage.setItem(
        "@usuario",
        JSON.stringify(data.usuario)
      );

      // mensaje éxito
      setTipoMensaje("success");

      setMensaje(
        "Inicio de sesión exitoso ✨"
      );

      // navegar
      setTimeout(() => {

        router.replace("/(tabs)");

      }, 1200);

    } catch (err: any) {

      setTipoMensaje("error");

      setMensaje(
        err.message ||
        "Error al iniciar sesión"
      );

    }

  }

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        🔐 Login
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {mensaje ? (
        <Text
          style={
            tipoMensaje === "error"
              ? styles.error
              : styles.success
          }
        >
          {mensaje}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogin}
      >
        <Text style={styles.btnText}>
          Entrar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push("/register")
        }
      >
        <Text style={styles.link}>
          Crear cuenta
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#050816",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 30,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#111827",
    color: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#312e81",
  },

  btn: {
    backgroundColor: "#9333ea",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  error: {
    color: "#f87171",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },

  success: {
    color: "#4ade80",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },

  link: {
    color: "#60a5fa",
    textAlign: "center",
    marginTop: 15,
    fontWeight: "bold",
  },

});