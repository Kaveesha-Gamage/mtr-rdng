import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import MeterReadingDashboard from "../../src/components/MeterReadingDashboard";

export default function DashboardScreen() {
  // You can pull real data from your pendingApi / pendingRepository later
  const dashboardData = {
    totalCustomers: 461,
    receivedCount: 0,
    pendingCount: 461,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render the Meter Reading Dashboard Card */}
        <MeterReadingDashboard
          totalCustomers={dashboardData.totalCustomers}
          receivedCount={dashboardData.receivedCount}
          pendingCount={dashboardData.pendingCount}
        />
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
});
