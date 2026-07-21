import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { initDatabase } from "../src/database/db";

export default function RootLayout(){
  useEffect(() => {
    try {
      initDatabase();
      console.log("SQLite database initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize SQLite database:", error);
    }
  }, []);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown:false,
        }}
      />
    </AuthProvider>
  );
}