import { Calendar, Clock } from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");
const CARD_PADDING = 24;
const CONTAINER_WIDTH = width - CARD_PADDING * 2;

interface MeterReadingDashboardProps {
  totalCustomers?: number;
  receivedCount?: number;
  pendingCount?: number;
}

export default function MeterReadingDashboard({
  totalCustomers = 461,
  receivedCount = 0,
  pendingCount = 461,
}: MeterReadingDashboardProps) {
  // Chart configurations
  const size = CONTAINER_WIDTH * 0.65;
  const strokeWidth = 32;
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
      {/* Header Titles */}
      <Text style={styles.mainTitle}>METER READING STATUS</Text>
      <TouchableOpacity
        style={styles.badge}
        onPress={() => router.push("/pending-readings")}
        activeOpacity={0.7}
      >
        <Text style={styles.badgeText}>PENDING READINGS</Text>
      </TouchableOpacity>

      {/* Donut Chart Component */}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F2F2F2"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Circle (Orange "Pending" Arc) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF5722"
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
          <Text style={styles.centerLabel}>Total Customers</Text>
        </View>
      </View>

      {/* Legend Row */}
      <View style={styles.legendContainer}>
        {/* Left Legend: Received */}
        <View style={styles.legendItem}>
          <View style={styles.legendHeader}>
            <View style={[styles.dot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendTitle}>Reading Taken</Text>
          </View>
          <Text style={styles.legendData}>
            {receivedCount}{" "}
            <Text style={styles.percentageText}>({receivedPercentage}%)</Text>
          </Text>
        </View>

        {/* Right Legend: Not Received */}
        <View style={styles.legendItem}>
          <View style={styles.legendHeader}>
            <View style={[styles.dot, { backgroundColor: "#FF5722" }]} />
            <Text style={styles.legendTitle}>Reading Not{"\n"}Taken</Text>
          </View>
          <Text style={styles.legendData}>
            {pendingCount}{" "}
            <Text style={styles.percentageText}>({pendingPercentage}%)</Text>
          </Text>
        </View>
      </View>

      {/* Bottom Status Grid Panel */}
      <View style={styles.bottomPanel}>
        {/* Received Section */}
        <View style={styles.panelSplit}>
          <View style={[styles.iconCircle, { borderColor: "#E8F5E9" }]}>
            <Clock size={22} color="#4CAF50" />
          </View>
          <View style={styles.panelTextContainer}>
            <Text style={styles.panelLabel}>RECEIVED</Text>
            <Text style={[styles.panelValue, { color: "#4CAF50" }]}>
              {receivedCount}
            </Text>
          </View>
        </View>

        {/* Vertical Divider Line */}
        <View style={styles.verticalDivider} />

        {/* Pending Section */}
        <View style={styles.panelSplit}>
          <View style={[styles.iconCircle, { borderColor: "#FFEBEE" }]}>
            <Calendar size={22} color="#E53935" />
          </View>
          <View style={styles.panelTextContainer}>
            <Text style={styles.panelLabel}>PENDING</Text>
            <Text style={[styles.panelValue, { color: "#E53935" }]}>
              {pendingCount}
            </Text>
          </View>
        </View>
      </View>
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#263238",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#7A0000",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 25,
  },
  badgeText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  chartCenterTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  centerNumber: {
    fontSize: 38,
    fontWeight: "800",
    color: "#212832",
  },
  centerLabel: {
    fontSize: 13,
    color: "#7C8794",
    marginTop: 2,
    fontWeight: "500",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 5,
    marginBottom: 35,
  },
  legendItem: {
    flex: 1,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 8,
  },
  legendTitle: {
    fontSize: 14,
    color: "#5A6776",
    fontWeight: "500",
    lineHeight: 18,
  },
  legendData: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212832",
    paddingLeft: 20,
  },
  percentageText: {
    color: "#8A94A6",
    fontWeight: "400",
  },
  bottomPanel: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    width: "100%",
  },
  panelSplit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  panelTextContainer: {
    marginLeft: 12,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  panelValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#E2E8F0",
  },
});
