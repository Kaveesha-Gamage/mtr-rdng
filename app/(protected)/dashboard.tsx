import { LogOut, Database } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import MeterReadingDashboard from "../../src/components/MeterReadingDashboard";
import { useAuth } from "../../src/context/AuthContext";
import { getPendingReadingsCount } from "../../src/database/pendingRepository";
import { exportDatabase } from "../../src/utils/exportDB";

export default function DashboardScreen() {
  const { logout } = useAuth();
  const isFocused = useIsFocused();

  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    receivedCount: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    if (isFocused) {
      try {
        const stats = getPendingReadingsCount();
        setDashboardData(stats);
      } catch (error) {
        console.error("Failed to load meter reading stats from SQLite:", error);
      }
    }
  }, [isFocused]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of the application?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.headerRightButton} activeOpacity={0.7}>
              <LogOut size={20} color="#8B0000" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render the Meter Reading Dashboard Card */}
        <MeterReadingDashboard
          totalCustomers={dashboardData.totalCustomers}
          receivedCount={dashboardData.receivedCount}
          pendingCount={dashboardData.pendingCount}
        />

        {/* Export Database Button */}
        <TouchableOpacity style={styles.exportButton} onPress={exportDatabase} activeOpacity={0.7}>
          <Database size={18} color="#2B6CB0" style={styles.exportIcon} />
          <Text style={styles.exportButtonText}>Export Database</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={18} color="#E53935" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  scrollContent: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightButton: {
    marginRight: 16,
    padding: 4,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    backgroundColor: "#EBF5FF",
    borderWidth: 1,
    borderColor: "#BEE3F8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "90%",
    maxWidth: 300,
    shadowColor: "#3182CE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: "#2B6CB0",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "90%",
    maxWidth: 300,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#E53935",
    fontSize: 16,
    fontWeight: "600",
  },
});
