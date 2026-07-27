import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ArrowRight } from "lucide-react-native";

const { width } = Dimensions.get("window");
const CARD_PADDING = 24;
const CONTAINER_WIDTH = width - CARD_PADDING * 2;

interface MeterReadingDashboardProps {
  totalCustomers?: number;
  receivedCount?: number;
  pendingCount?: number;
}

export default function MeterReadingDashboard({
  totalCustomers = 0,
  receivedCount = 0,
  pendingCount = 0,
}: MeterReadingDashboardProps) {
  // Chart configurations
  const size = CONTAINER_WIDTH * 0.65;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Calculate percentages safely
  const receivedPercentage =
    totalCustomers > 0
      ? ((receivedCount / totalCustomers) * 100).toFixed(1)
      : "0.0";
  const pendingPercentage =
    totalCustomers > 0
      ? ((pendingCount / totalCustomers) * 100).toFixed(1)
      : "0.0";

  // Calculate stroke offset for the orange "Not Received" arc
  const strokeDashoffset =
    totalCustomers > 0
      ? circumference - (pendingCount / totalCustomers) * circumference
      : circumference;

  return (
    <View style={styles.cardContainer}>
      {/* Header Title */}
      <Text style={styles.mainTitle}>METER READING PROGRESS</Text>

      {/* Donut Chart Component */}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle (Completed / Reading Taken) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1062FE"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Circle (Orange "Pending" Arc) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF7A00"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Centered Text inside Donut Chart */}
        <View style={styles.chartCenterTextContainer}>
          <Text style={styles.centerNumber}>{totalCustomers}</Text>
          <Text style={styles.centerLabel}>Total Accounts</Text>
        </View>
      </View>

      {/* Legend Row */}
      <View style={styles.legendContainer}>
        {/* Left Legend: Received */}
        <View style={styles.legendItem}>
          <View style={styles.legendHeader}>
            <View style={[styles.dot, { backgroundColor: "#1062FE" }]} />
            <Text style={styles.legendTitle}>Readings Taken</Text>
          </View>
          <Text style={styles.legendData}>
            {receivedCount}{" "}
            <Text style={styles.percentageText}>({receivedPercentage}%)</Text>
          </Text>
        </View>

        {/* Right Legend: Not Received */}
        <View style={styles.legendItem}>
          <View style={styles.legendHeader}>
            <View style={[styles.dot, { backgroundColor: "#FF7A00" }]} />
            <Text style={styles.legendTitle}>Readings Pending</Text>
          </View>
          <Text style={styles.legendData}>
            {pendingCount}{" "}
            <Text style={styles.percentageText}>({pendingPercentage}%)</Text>
          </Text>
        </View>
      </View>

      {/* View List Navigation Badge */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push("/pending-readings")}
        activeOpacity={0.8}
      >
        <Text style={styles.actionButtonText}>View Pending Readings List</Text>
        <ArrowRight size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CONTAINER_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 20,
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  chartCenterTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  centerNumber: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1E293B",
  },
  centerLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  legendItem: {
    flex: 1,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendTitle: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  legendData: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    paddingLeft: 16,
  },
  percentageText: {
    color: "#94A3B8",
    fontWeight: "500",
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: "#8B0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 8,
  },
});
