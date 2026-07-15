import React, { useEffect, useState } from "react";
import {View,Text,StyleSheet,TextInput,FlatList,TouchableOpacity,ActivityIndicator,} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import { downloadPendingReadings } from "../../../src/services/pendingService";
import { PendingReading } from "../../../src/types/PendingReading";

export default function PendingReadings() {
  const [customers, setCustomers] = useState<PendingReading[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<PendingReading[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Account Number");
  const [netType, setNetType] = useState("All");
  const [show, setShow] = useState("10");

  useEffect(() => {
    loadPendingReadings();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [search, customers]);

  const loadPendingReadings = async () => {
    try {
      setLoading(true);

      const response = await downloadPendingReadings();

      if (response.success) {
        setCustomers(response.pending_readings);
        setFilteredCustomers(response.pending_readings);
      }
    } catch (error) {
      console.log("Download Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let data = [...customers];

    if (search.trim() !== "") {
      data = data.filter((item) =>
        item.accountNumber
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    setFilteredCustomers(data);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10 }}>Loading Pending Readings...</Text>
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Account</Text>
              <Text>{item.accountNumber}</Text>
            </View>

            <View style={{ flex: 3 }}>
              <Text style={styles.label}>Installation</Text>
              <Text>{item.installationId}</Text>
            </View>

            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Category</Text>
              <Text>{item.customerCategory}</Text>
            </View>

            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Net Type</Text>
              <Text>{item.netTypeName}</Text>
              <Text>Reader : {item.readerCode}</Text>
            </View>

            <TouchableOpacity style={styles.button}>
              <Ionicons
                name="add"
                color="white"
                size={18}
              />

              <Text style={styles.buttonText}>
                Insert Reading
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: "#F4F4F4",
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
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },

  input: {
    flex: 1,
    height: 45,
    marginLeft: 8,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: "white",
  },

  card: {
    backgroundColor: "#FFF6F6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  label: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#666",
    fontSize: 12,
  },

  button: {
    backgroundColor: "#1EAF45",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },

  buttonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#666",
    fontSize: 16,
  },
});