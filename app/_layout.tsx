import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDatabase } from "../src/database/db";

export default function Layout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return <Stack />;
}