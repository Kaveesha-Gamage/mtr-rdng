import { LogOut, Database } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import MeterReadingDashboard from "../../src/components/MeterReadingDashboard";
import { useAuth } from "../../src/context/AuthContext";
import { getPendingReadingsCount } from "../../src/database/pendingRepository";
import { exportDatabase } from "../../src/utils/exportDB";

export default function DashboardScreen() {
  const { logout, session } = useAuth();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

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
    <View style={styles.container}>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 }
        ]}
      >
        {/* Welcome Section */}
        {session ? (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeGreet}>Welcome Back, {session.userName} 👋</Text>
            <View style={styles.sessionDetailsRow}>
              <View style={styles.sessionDetailItem}>
                <Text style={styles.sessionDetailLabel}>AREA CODE</Text>
                <Text style={styles.sessionDetailVal}>{session.areaCode}</Text>
              </View>
              <View style={styles.sessionDetailDivider} />
              <View style={styles.sessionDetailItem}>
                <Text style={styles.sessionDetailLabel}>BILL CYCLE</Text>
                <Text style={styles.sessionDetailVal}>{session.activeBillCycle}</Text>
              </View>
              <View style={styles.sessionDetailDivider} />
              <View style={styles.sessionDetailItem}>
                <Text style={styles.sessionDetailLabel}>REGION</Text>
                <Text style={styles.sessionDetailVal}>{session.regionCode}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Render the Meter Reading Dashboard Card */}
        <MeterReadingDashboard
          totalCustomers={dashboardData.totalCustomers}
          receivedCount={dashboardData.receivedCount}
          pendingCount={dashboardData.pendingCount}
        />

        {/* Export Database Button */}
        <TouchableOpacity style={styles.exportButton} onPress={exportDatabase} activeOpacity={0.7}>
          <Database size={18} color="#475569" style={styles.exportIcon} />
          <Text style={styles.exportButtonText}>Export SQLite Database</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={18} color="#EF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingTop: 20,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  headerRightButton: {
    marginRight: 16,
    padding: 4,
  },
  welcomeCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeGreet: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  sessionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sessionDetailItem: {
    flex: 1,
    alignItems: "center",
  },
  sessionDetailLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sessionDetailVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  sessionDetailDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
});
