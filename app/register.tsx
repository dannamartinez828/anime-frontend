import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { register } from "./authApi";

import { useRouter } from "expo-router";

export default function Register() {

  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [tipoMensaje, setTipoMensaje] =
    useState<"error" | "success" | "">("");

  async function handleRegister() {

    try {

      setMensaje("");
      setTipoMensaje("");

      // validar campos
      if (
        !username ||
        !email ||
        !password
      ) {

        setTipoMensaje("error");

        setMensaje(
          "Todos los campos son obligatorios"
        );

        return;
      }

      await register(
        username,
        email,
        password
      );

      // éxito
      setTipoMensaje("success");

      setMensaje(
        "Usuario registrado correctamente ✨"
      );

      // navegar login
      setTimeout(() => {

        router.replace("/login");

      }, 1500);

    } catch (err: any) {

      setTipoMensaje("error");

      setMensaje(
        err.message ||
        "Error al registrarse"
      );

    }

  }

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        🧾 Registro
      </Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

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
        onPress={handleRegister}
      >
        <Text style={styles.btnText}>
          Crear cuenta
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push("/login")
        }
      >
        <Text style={styles.link}>
          Ya tengo cuenta
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
    backgroundColor: "#ec4899",
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