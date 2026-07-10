import { router } from "expo-router";
import React, { useState } from "react";
import {Image,StyleSheet,Text,TextInput,TouchableOpacity,ActivityIndicator,View,Alert,} from "react-native";
import { loginService } from "../src/services/authService";

import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await loginService({
        user_id: userId,
        password: password,
      });

      if (response.success) {
        router.replace("/dashboard");
      } else {
        Alert.alert("Login Failed", response.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ??
          "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../assets/images/edl-logo.png")}
        style={styles.logo}
      />

      {/* Title */}
      <Text style={styles.title}>BULK METER READER</Text>
      <Text style={styles.subtitle}>Bulk Billing System</Text>

      {/* Username Label */}
      <Text style={styles.label}>USER NAME</Text>

      {/* Username Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={24} color="#B5B5B5" />

        <TextInput
          placeholder="Enter your username"
          value={userId}
          onChangeText={setUserId}
          placeholderTextColor="#999"
          style={styles.input}
        />
      </View>

      {/* Password Label */}
      <Text style={styles.label}>PASSWORD</Text>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={24} color="#B5B5B5" />

        <TextInput
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
          secureTextEntry={!passwordVisible}
          style={styles.input}
        />

        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Ionicons
            name={passwordVisible ? "eye-outline" : "eye-off-outline"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Remember Me */}
      <View style={styles.rememberContainer}>
        <View style={styles.checkbox}></View>

        <Text style={styles.rememberText}>Remember me</Text>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
        <Text style={styles.buttonText}>SIGN IN</Text>
        )}
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity>
        <Text style={styles.forgot}>FORGOT PASSWORD?</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Billing System, EDL.</Text>

        <Text style={styles.footerText}>All Rights Reserved Version 2.0.2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 35,
    justifyContent: "center",
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    textAlign: "center",
    fontSize: 18,
    color: "#999",
    marginTop: 8,
    marginBottom: 80,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 12,
    marginTop: 15,
  },

  inputContainer: {
    height: 65,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FAFAFA",
  },

  input: {
    flex: 1,
    fontSize: 17,
    marginLeft: 15,
    color: "#333",
  },

  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: "#777",
    marginRight: 12,
  },

  rememberText: {
    fontSize: 17,
    color: "#777",
  },

  button: {
    height: 65,
    backgroundColor: "#B00000",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  forgot: {
    textAlign: "center",
    marginTop: 10,
    color: "#A00000",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 15,
  },

  footer: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    alignItems: "center",
  },

  footerText: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
});
