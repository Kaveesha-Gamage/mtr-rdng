import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { getPendingReadingsFromDB } from "../../../src/database/pendingRepository";
import { downloadPendingReadings } from "../../../src/services/pendingService";
import { PendingReading } from "../../../src/types/PendingReading";

export default function PendingReadings() {
  const [customers, setCustomers] = useState<PendingReading[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<PendingReading[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Account Number");
  const [netType, setNetType] = useState("All");
  const [show, setShow] = useState("10");

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      try {
        const dbReadings = getPendingReadingsFromDB();
        if (dbReadings.length > 0) {
          setCustomers(dbReadings);
          setLoading(false);
        } else {
          loadPendingReadings();
        }
      } catch (err) {
        console.error("Failed to load pending readings on focus:", err);
        loadPendingReadings();
      }
    }
  }, [isFocused]);

  const filterCustomers = useCallback(() => {
    let data = [...customers];

    // 1. Search Filter (by Account Number)
    if (search.trim() !== "") {
      data = data.filter((item) =>
        item.accountNumber
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    // 2. Net Type Filter
    if (netType !== "All") {
      data = data.filter((item) => item.netType === netType);
    }

    // 3. Sorting
    data.sort((a, b) => {
      if (sortBy === "Account Number") {
        return (a.accountNumber || "").localeCompare(b.accountNumber || "");
      } else if (sortBy === "Installation ID") {
        return (a.installationId || "").localeCompare(b.installationId || "");
      }
      return 0;
    });

    // 4. Limit items (Pagination/Show count)
    const limit = parseInt(show, 10);
    if (!isNaN(limit)) {
      data = data.slice(0, limit);
    }

    setFilteredCustomers(data);
  }, [search, sortBy, netType, show, customers]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  /**
   * Data flow:
   *  pendingService downloads from the API → clears SQLite → saves new records
   *  → reads back from SQLite and returns the result.
   * The UI only ever renders what SQLite contains.
   */
  const loadPendingReadings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check SQLite first
      const dbReadings = getPendingReadingsFromDB();
      if (dbReadings.length > 0) {
        setCustomers(dbReadings);
        setLoading(false);
        return;
      }

      const response = await downloadPendingReadings();

      const readings = Array.isArray(response.pending_readings)
        ? response.pending_readings
        : (response.pending_readings as any)?.pending_customers ?? [];

      setCustomers(readings);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error("Failed to load pending readings:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10 }}>Loading Pending Readings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#8B0000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPendingReadings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.headerText}>Pending Readings</Text>
      </View>

      {/* Search */}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="gray" />

        <TextInput
          placeholder="Search by Account Number..."
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {/* Filters */}

      <View style={styles.filterRow}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={sortBy} onValueChange={setSortBy}>
            <Picker.Item
              label="Account Number"
              value="Account Number"
            />
            <Picker.Item
              label="Installation ID"
              value="Installation ID"
            />
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={netType} onValueChange={setNetType}>
            <Picker.Item
              label="All Net Types"
              value="All"
            />
            <Picker.Item
              label="Net Metering"
              value="1"
            />
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={show} onValueChange={setShow}>
            <Picker.Item label="10" value="10" />
            <Picker.Item label="20" value="20" />
            <Picker.Item label="50" value="50" />
          </Picker>
        </View>
      </View>

      {/* Pending Reading List */}

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item, index) => `${item.accountNumber || ""}-${item.installationId || ""}-${index}`}
        renderItem={({ item }) => {
          const netTypeName = item.netTypeName || item.netType || "Standard";
          const isMetering = netTypeName.toLowerCase().includes("metering");
          const isPlus = netTypeName.toLowerCase().includes("plus");
          const isAccounting = netTypeName.toLowerCase().includes("accounting");

          const badgeStyle = isMetering
            ? styles.badgeBlue
            : isPlus
              ? styles.badgePurple
              : isAccounting
                ? styles.badgeOrange
                : styles.badgeGray;

          const badgeTextStyle = isMetering
            ? styles.badgeTextBlue
            : isPlus
              ? styles.badgeTextPurple
              : isAccounting
                ? styles.badgeTextOrange
                : styles.badgeTextGray;

          const isCompleted = item.r1 !== null && item.r1 !== undefined;

          return (
            <View style={[styles.card, isCompleted && styles.completedCard]}>
              {/* Top Row: Account Number & Net Type Badge */}
              <View style={styles.cardTopRow}>
                <View style={styles.accountContainer}>
                  <Ionicons name="flash-outline" size={16} color={isCompleted ? "#1062FE" : "#8B0000"} style={{ marginRight: 5 }} />
                  <Text style={styles.accountNumberText}>{item.accountNumber}</Text>
                </View>

                <View style={[styles.badge, badgeStyle]}>
                  <Text style={[styles.badgeText, badgeTextStyle]}>{netTypeName}</Text>
                </View>
              </View>

              {/* Middle Row: Customer Name */}
              <Text style={styles.customerNameText} numberOfLines={2}>
                {item.customerName || "Customer Name Unavailable"}
              </Text>

              {/* Bottom Row: Reader info & Action Button */}
              <View style={styles.cardBottomRow}>
                <View style={styles.metaContainer}>
                  {item.readerCode ? (
                    <Text style={styles.metaText}>Reader: {item.readerCode}</Text>
                  ) : null}
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#1062FE" style={{ marginRight: 4 }} />
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.button, isCompleted && styles.completedButton]}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/insert-reading" as any,
                      params: {
                        accountNumber: item.accountNumber,
                        installationId: item.installationId,
                      },
                    })
                  }
                >
                  <Ionicons name={isCompleted ? "create-outline" : "add-circle"} color="white" size={16} />
                  <Text style={styles.buttonText}>{isCompleted ? "Edit Reading" : "Insert Reading"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No pending readings found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 15,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: "#8B0000",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  headerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 15,
  },

  input: {
    flex: 1,
    height: 45,
    marginLeft: 8,
    fontSize: 14,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: "white",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  accountNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    letterSpacing: 0.5,
  },

  customerNameText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    lineHeight: 20,
    marginBottom: 10,
  },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
  },

  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    fontSize: 12,
    color: "#777777",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  badgeBlue: { backgroundColor: "#EBF3FF" },
  badgeTextBlue: { color: "#1062FE" },

  badgePurple: { backgroundColor: "#F5EEFF" },
  badgeTextPurple: { color: "#8A3FFC" },

  badgeOrange: { backgroundColor: "#FFF3E0" },
  badgeTextOrange: { color: "#E65100" },

  badgeGray: { backgroundColor: "#F4F4F4" },
  badgeTextGray: { color: "#666666" },

  button: {
    backgroundColor: "#1EAF45",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  buttonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 13,
  },

  completedCard: {
    borderColor: "#1062FE",
    backgroundColor: "#F0F6FF",
  },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2EFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },

  completedBadgeText: {
    fontSize: 10,
    color: "#1062FE",
    fontWeight: "700",
  },

  completedButton: {
    backgroundColor: "#1062FE",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#666",
    fontSize: 16,
  },

  errorText: {
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 24,
    color: "#8B0000",
    fontSize: 15,
    lineHeight: 22,
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: "#8B0000",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});