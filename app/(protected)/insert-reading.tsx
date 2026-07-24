import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getPendingReading, saveMeterReading } from "../../src/database/pendingRepository";
import { PendingReading } from "../../src/types/PendingReading";

export default function InsertReadingScreen() {
  const { accountNumber, installationId } = useLocalSearchParams<{
    accountNumber: string;
    installationId: string;
  }>();

  const [customer, setCustomer] = useState<PendingReading | null>(null);

  // Form Inputs
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");
  const [r3, setR3] = useState("");
  const [kva, setKva] = useState("");
  const [kvah, setKvah] = useState("");
  const [readingDate, setReadingDate] = useState("");
  const [meterSequence, setMeterSequence] = useState("");

  // Input Focus States for Premium Visual Highlight
  const [focusField, setFocusField] = useState<string | null>(null);

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Function to format standard YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  useEffect(() => {
    if (accountNumber && installationId) {
      try {
        const record = getPendingReading(accountNumber, installationId);
        if (record) {
          setCustomer(record);
          setR1(record.r1 !== null && record.r1 !== undefined ? String(record.r1) : "");
          setR2(record.r2 !== null && record.r2 !== undefined ? String(record.r2) : "");
          setR3(record.r3 !== null && record.r3 !== undefined ? String(record.r3) : "");
          setKva(record.kva !== null && record.kva !== undefined ? String(record.kva) : "");
          setKvah(record.kvah !== null && record.kvah !== undefined ? String(record.kvah) : "");
          setReadingDate(record.readingDate || new Date().toISOString().split("T")[0]);
          setMeterSequence(record.meterSequence !== undefined && record.meterSequence !== null ? String(record.meterSequence) : "1");
        } else {
          Alert.alert("Error", "Customer record not found locally.");
        }
      } catch (err) {
        console.error("Failed to load customer record:", err);
        Alert.alert("Database Error", "Unable to load customer record from SQLite.");
      }
    }
  }, [accountNumber, installationId]);

  const triggerHaptic = (type: "light" | "success" | "error") => {
    try {
      if (type === "light") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      // Fallback if haptics is not supported/configured
    }
  };

  const handleSave = () => {
    if (!accountNumber || !installationId) return;

    // Numerical parses
    const valR1 = r1.trim() !== "" ? parseFloat(r1) : null;
    const valR2 = r2.trim() !== "" ? parseFloat(r2) : null;
    const valR3 = r3.trim() !== "" ? parseFloat(r3) : null;
    const valKva = kva.trim() !== "" ? parseFloat(kva) : null;
    const valKvah = kvah.trim() !== "" ? parseFloat(kvah) : null;
    const valSeq = meterSequence.trim() !== "" ? parseInt(meterSequence, 10) : null;

    // Field Validations
    if (valR1 !== null && isNaN(valR1)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "R1 must be a valid number.");
      return;
    }
    if (valR2 !== null && isNaN(valR2)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "R2 must be a valid number.");
      return;
    }
    if (valR3 !== null && isNaN(valR3)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "R3 must be a valid number.");
      return;
    }
    if (valKva !== null && isNaN(valKva)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "KVA must be a valid number.");
      return;
    }
    if (valKvah !== null && isNaN(valKvah)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "KVAH must be a valid number.");
      return;
    }
    if (valSeq !== null && isNaN(valSeq)) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "Meter Sequence must be an integer.");
      return;
    }

    try {
      saveMeterReading(accountNumber, installationId, {
        r1: valR1,
        r2: valR2,
        r3: valR3,
        kva: valKva,
        kvah: valKvah,
        readingDate: readingDate.trim() || null,
        meterSequence: valSeq,
      });

      triggerHaptic("success");
      Alert.alert("Success", "Meter readings saved successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Save reading failed:", error);
      triggerHaptic("error");
      Alert.alert("Save Error", "Failed to save the readings to local storage.");
    }
  };

  const renderCalendarModal = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const days = [];
    // Prefix empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const handlePrevMonth = () => {
      triggerHaptic("light");
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };

    const handleNextMonth = () => {
      triggerHaptic("light");
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    const handleDateSelect = (day: number) => {
      const selected = formatDate(currentYear, currentMonth, day);
      setReadingDate(selected);
      setShowCalendar(false);
      triggerHaptic("success");
    };

    return (
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#8B0000" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#8B0000" />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.weekdaysRow}>
              {weekDays.map((day, index) => (
                <Text key={index} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                }
                const formatted = formatDate(currentYear, currentMonth, day);
                const isSelected = readingDate === formatted;

                const todayObj = new Date();
                const isToday = formatDate(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()) === formatted;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setShowCalendar(false); triggerHaptic("light"); }}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Insert Reading" }} />
        <Text style={styles.loadingText}>Loading record details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderCalendarModal()}
      <Stack.Screen
        options={{
          title: "Insert Reading",
          headerStyle: { backgroundColor: "#8B0000" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Customer Metadata Profile - Premium Genuine UI */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#8B0000" style={{ marginRight: 8 }} />
              <Text style={styles.profileTitle} numberOfLines={1}>
                {customer.customerName || "No Customer Name Available"}
              </Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>ACCOUNT NUMBER</Text>
                <Text style={styles.metaValue} selectable>{customer.accountNumber}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>METER NUMBER</Text>
                <Text style={styles.metaValue} selectable>{customer.installationId}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>TARIFF</Text>
                <Text style={styles.metaValue}>{customer.tariff || "N/A"}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>
                  {(customer.netTypeName || customer.netType || "").toLowerCase().includes("metering") ||
                    (customer.netTypeName || customer.netType || "").toLowerCase().includes("plus") ||
                    (customer.netTypeName || customer.netType || "").toLowerCase().includes("accounting")
                    ? "SOLAR TYPE"
                    : "NET TYPE"}
                </Text>
                <Text style={styles.metaValue}>
                  {customer.netTypeName || customer.netType || "Standard"}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Inputs Section */}
          <Text style={styles.sectionHeader}>ENTER METER READINGS</Text>

          <View style={styles.formContainer}>
            {/* R1 Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>R1</Text>
              <View style={[styles.inputWrapper, focusField === "r1" && styles.inputWrapperFocused]}>
                <Ionicons name="speedometer-outline" size={20} color={focusField === "r1" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter R1 reading"
                  value={r1}
                  onChangeText={setR1}
                  keyboardType="default"
                  onFocus={() => { setFocusField("r1"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* R2 Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>R2</Text>
              <View style={[styles.inputWrapper, focusField === "r2" && styles.inputWrapperFocused]}>
                <Ionicons name="speedometer-outline" size={20} color={focusField === "r2" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter R2 reading"
                  value={r2}
                  onChangeText={setR2}
                  keyboardType="default"
                  onFocus={() => { setFocusField("r2"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* R3 Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>R3</Text>
              <View style={[styles.inputWrapper, focusField === "r3" && styles.inputWrapperFocused]}>
                <Ionicons name="speedometer-outline" size={20} color={focusField === "r3" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter R3 reading"
                  value={r3}
                  onChangeText={setR3}
                  keyboardType="default"
                  onFocus={() => { setFocusField("r3"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* KVA Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KVA</Text>
              <View style={[styles.inputWrapper, focusField === "kva" && styles.inputWrapperFocused]}>
                <Ionicons name="speedometer-outline" size={20} color={focusField === "kva" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter KVA"
                  value={kva}
                  onChangeText={setKva}
                  keyboardType="default"
                  onFocus={() => { setFocusField("kva"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* KVAH Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>KVAH</Text>
              <View style={[styles.inputWrapper, focusField === "kvah" && styles.inputWrapperFocused]}>
                <Ionicons name="speedometer-outline" size={20} color={focusField === "kvah" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter KVAH"
                  value={kvah}
                  onChangeText={setKvah}
                  keyboardType="default"
                  onFocus={() => { setFocusField("kvah"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* Reading Date Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reading Date</Text>
              <View style={[styles.inputWrapper, focusField === "date" && styles.inputWrapperFocused]}>
                <TouchableOpacity onPress={() => { setShowCalendar(true); triggerHaptic("light"); }} style={{ marginRight: 6 }}>
                  <Ionicons name="calendar-outline" size={20} color={showCalendar ? "#1062FE" : "#94A3B8"} />
                </TouchableOpacity>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={readingDate}
                  onChangeText={setReadingDate}
                  onFocus={() => { setFocusField("date"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
                <TouchableOpacity onPress={() => { setShowCalendar(true); triggerHaptic("light"); }}>
                  <Ionicons name="chevron-down-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Meter Sequence Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meter Sequence</Text>
              <View style={[styles.inputWrapper, focusField === "sequence" && styles.inputWrapperFocused]}>
                <Ionicons name="list-outline" size={20} color={focusField === "sequence" ? "#1062FE" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter sequence order"
                  value={meterSequence}
                  onChangeText={setMeterSequence}
                  keyboardType="default"
                  onFocus={() => { setFocusField("sequence"); triggerHaptic("light"); }}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="save" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Save Readings</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metaCell: {
    width: "48%",
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 10,
    letterSpacing: 1,
    paddingLeft: 4,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: "#1062FE",
    backgroundColor: "#FFFFFF",
    shadowColor: "#1062FE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#8B0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  calendarCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  weekdayText: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    borderRadius: 18,
  },
  dayCellEmpty: {
    width: 36,
    height: 36,
    marginVertical: 4,
  },
  dayCellSelected: {
    backgroundColor: "#8B0000",
  },
  dayCellToday: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  dayTextToday: {
    color: "#8B0000",
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
});
