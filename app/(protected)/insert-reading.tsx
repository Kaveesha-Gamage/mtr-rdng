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

import {
  getPendingReading,
  saveMultiSequenceReadings,
  updatePendingReading,
} from "../../src/database/pendingRepository";
import { PendingReading } from "../../src/types/PendingReading";

// ─── Net Type Category ──────────────────────────────────────────────────────
type NetTypeCategory =
  | "normal"
  | "net_metering"
  | "net_accounting"
  | "net_plus_plus"
  | "net_plus";

/**
 * Classifies a net type string into one of 5 categories.
 */
function getNetTypeCategory(netTypeName: string): NetTypeCategory {
  const n = (netTypeName || "").toLowerCase().trim();
  if (n.includes("accounting")) return "net_accounting";
  if (n.includes("metering")) return "net_metering";
  if (n.includes("++") || n.includes("plus plus") || n.includes("net plus plus")) return "net_plus_plus";
  if (n.includes("+") || n.includes("net plus") || n.includes("net+")) return "net_plus";
  return "normal";
}

const NET_TYPE_LABELS: Record<NetTypeCategory, string> = {
  normal: "Normal",
  net_metering: "Net Metering",
  net_accounting: "Net Accounting",
  net_plus_plus: "Net ++",
  net_plus: "Net +",
};

const NET_TYPE_COLORS: Record<NetTypeCategory, string> = {
  normal: "#64748B",
  net_metering: "#1062FE",
  net_accounting: "#E65100",
  net_plus_plus: "#8A3FFC",
  net_plus: "#0D9B6A",
};

// ─── Reusable Reading Field ─────────────────────────────────────────────────
interface ReadingFieldProps {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  focusField: string | null;
  setFocusField: (k: string | null) => void;
  onHaptic: () => void;
  accentColor: string;
}

function ReadingField({
  label,
  fieldKey,
  value,
  onChange,
  focusField,
  setFocusField,
  onHaptic,
  accentColor,
}: ReadingFieldProps) {
  const isFocused = focusField === fieldKey;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          isFocused && { borderColor: accentColor, backgroundColor: "#FFFFFF" },
        ]}
      >
        <Ionicons
          name="speedometer-outline"
          size={20}
          color={isFocused ? accentColor : "#94A3B8"}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder={`Enter ${label}`}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          onFocus={() => {
            setFocusField(fieldKey);
            onHaptic();
          }}
          onBlur={() => setFocusField(null)}
        />
      </View>
    </View>
  );
}

// ─── Multi-Sequence Section Card ────────────────────────────────────────────
interface MeterSectionProps {
  title: string;
  subtitle: string;
  mtrSeq: number;
  accentColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  prefix: string;        // "imp" | "exp" | "imp_exp"
  values: Record<string, string>;
  setValues: (vals: Record<string, string>) => void;
  focusField: string | null;
  setFocusField: (k: string | null) => void;
  onHaptic: () => void;
}

function MeterSection({
  title,
  subtitle,
  mtrSeq,
  accentColor,
  iconName,
  prefix,
  values,
  setValues,
  focusField,
  setFocusField,
  onHaptic,
}: MeterSectionProps) {
  const fields = ["r1", "r2", "r3", "kva", "kvah"];
  const fieldLabels: Record<string, string> = {
    r1: "R1",
    r2: "R2",
    r3: "R3",
    kva: "KVA",
    kvah: "KVAH",
  };

  return (
    <View style={[styles.sectionCard, { borderLeftColor: accentColor }]}>
      {/* Section Header */}
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIconBadge, { backgroundColor: accentColor + "18" }]}>
          <Ionicons name={iconName} size={18} color={accentColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.sectionCardTitle, { color: accentColor }]}>{title}</Text>
          <Text style={styles.sectionCardSubtitle}>{subtitle} · mtr_seq = {mtrSeq}</Text>
        </View>
      </View>

      {/* Reading Fields */}
      {fields.map((f) => {
        const key = `${prefix}_${f}`;
        return (
          <ReadingField
            key={key}
            label={fieldLabels[f]}
            fieldKey={key}
            value={values[key] ?? ""}
            onChange={(v) => setValues({ ...values, [key]: v })}
            focusField={focusField}
            setFocusField={setFocusField}
            onHaptic={onHaptic}
            accentColor={accentColor}
          />
        );
      })}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function InsertReadingScreen() {
  const params = useLocalSearchParams<{
    accountNumber: string;
    installationId: string;
  }>();

  const accountNumber =
    typeof params.accountNumber === "string"
      ? params.accountNumber
      : Array.isArray(params.accountNumber)
        ? params.accountNumber[0]
        : "";

  const installationId =
    typeof params.installationId === "string"
      ? params.installationId
      : Array.isArray(params.installationId)
        ? params.installationId[0]
        : "";

  const [customer, setCustomer] = useState<PendingReading | null>(null);

  // ── Normal meter fields ──
  const [currentReading, setCurrentReading] = useState("");
  const [remarks, setRemarks] = useState("");

  // ── Multi-sequence fields (flat map: "imp_r1" etc.) ──
  const [meterValues, setMeterValues] = useState<Record<string, string>>({});

  // ── Shared ──
  const [readingDate, setReadingDate] = useState("");
  const [focusField, setFocusField] = useState<string | null>(null);

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // ── Derived ──
  const netTypeName = customer
    ? customer.netTypeName || customer.netType || ""
    : "";
  const netTypeCategory = getNetTypeCategory(netTypeName);
  const isMultiSeq = netTypeCategory !== "normal";

  // ── Load customer record ──
  useEffect(() => {
    if (accountNumber && installationId) {
      if (
        customer &&
        String(customer.accountNumber).trim().toLowerCase() ===
          String(accountNumber).trim().toLowerCase() &&
        String(customer.installationId).trim().toLowerCase() ===
          String(installationId).trim().toLowerCase()
      ) {
        return;
      }

      try {
        const record = getPendingReading(accountNumber, installationId);
        if (record) {
          setCustomer(record);
          setReadingDate(
            record.readingDate || new Date().toISOString().split("T")[0]
          );

          if (getNetTypeCategory(record.netTypeName || record.netType || "") !== "normal") {
            // Restore multi-sequence values
            setMeterValues({
              imp_r1: record.imp_r1 != null ? String(record.imp_r1) : "",
              imp_r2: record.imp_r2 != null ? String(record.imp_r2) : "",
              imp_r3: record.imp_r3 != null ? String(record.imp_r3) : "",
              imp_kva: record.imp_kva != null ? String(record.imp_kva) : "",
              imp_kvah: record.imp_kvah != null ? String(record.imp_kvah) : "",
              exp_r1: record.exp_r1 != null ? String(record.exp_r1) : "",
              exp_r2: record.exp_r2 != null ? String(record.exp_r2) : "",
              exp_r3: record.exp_r3 != null ? String(record.exp_r3) : "",
              exp_kva: record.exp_kva != null ? String(record.exp_kva) : "",
              exp_kvah: record.exp_kvah != null ? String(record.exp_kvah) : "",
              imp_exp_r1: record.imp_exp_r1 != null ? String(record.imp_exp_r1) : "",
              imp_exp_r2: record.imp_exp_r2 != null ? String(record.imp_exp_r2) : "",
              imp_exp_r3: record.imp_exp_r3 != null ? String(record.imp_exp_r3) : "",
              imp_exp_kva: record.imp_exp_kva != null ? String(record.imp_exp_kva) : "",
              imp_exp_kvah: record.imp_exp_kvah != null ? String(record.imp_exp_kvah) : "",
            });
          } else {
            // Restore normal reading fields
            setCurrentReading(
              record.currentReading != null ? String(record.currentReading) : ""
            );
            setRemarks(record.remarks || "");
          }
        } else {
          Alert.alert("Error", "Customer record not found locally.");
        }
      } catch (err) {
        console.error("Failed to load customer record:", err);
        Alert.alert(
          "Database Error",
          "Unable to load customer record from SQLite."
        );
      }
    }
  }, [accountNumber, installationId, customer]);

  // ── Haptics ──
  const triggerHaptic = (type: "light" | "success" | "error") => {
    try {
      if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (_) {}
  };

  // ── Parse helper ──
  const parseNum = (s: string): number | null => {
    if (s.trim() === "") return null;
    const v = parseFloat(s);
    return isNaN(v) ? undefined as any : v;
  };

  // ── Validation helper ──
  const validateNum = (s: string, label: string): boolean => {
    if (s.trim() === "") return true; // optional
    if (isNaN(parseFloat(s))) {
      triggerHaptic("error");
      Alert.alert("Validation Error", `${label} must be a valid number.`);
      return false;
    }
    return true;
  };

  // ── Save handler ──
  const handleSave = () => {
    if (!accountNumber || !installationId || !customer) return;

    if (!readingDate.trim()) {
      triggerHaptic("error");
      Alert.alert("Validation Error", "Please select a reading date.");
      return;
    }

    if (netTypeCategory === "normal") {
      // ── Normal meter ──
      const valCurrent = currentReading.trim() !== "" ? parseFloat(currentReading) : null;
      if (valCurrent === null) {
        triggerHaptic("error");
        Alert.alert("Validation Error", "Please enter the current meter reading.");
        return;
      }
      if (isNaN(valCurrent)) {
        triggerHaptic("error");
        Alert.alert("Validation Error", "Current reading must be a valid number.");
        return;
      }
      try {
        updatePendingReading(
          accountNumber,
          installationId,
          valCurrent,
          remarks.trim() || null,
          readingDate.trim() || null
        );
        triggerHaptic("success");
        Alert.alert("Success", "Meter reading saved successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } catch (error) {
        triggerHaptic("error");
        Alert.alert("Save Error", "Failed to save the reading to local storage.");
      }
    } else {
      // ── Multi-sequence meter (Metering / Accounting / ++ / +) ──
      const seqLabels: Array<[string, string]> = [
        ["imp_r1", "Import R1"], ["imp_r2", "Import R2"], ["imp_r3", "Import R3"],
        ["imp_kva", "Import KVA"], ["imp_kvah", "Import KVAH"],
        ["exp_r1", "Export R1"], ["exp_r2", "Export R2"], ["exp_r3", "Export R3"],
        ["exp_kva", "Export KVA"], ["exp_kvah", "Export KVAH"],
      ];

      if (netTypeCategory === "net_plus") {
        seqLabels.push(
          ["imp_exp_r1", "Imp-in-Exp R1"], ["imp_exp_r2", "Imp-in-Exp R2"],
          ["imp_exp_r3", "Imp-in-Exp R3"], ["imp_exp_kva", "Imp-in-Exp KVA"],
          ["imp_exp_kvah", "Imp-in-Exp KVAH"]
        );
      }

      for (const [key, label] of seqLabels) {
        if (!validateNum(meterValues[key] ?? "", label)) return;
      }

      try {
        saveMultiSequenceReadings(accountNumber, installationId, {
          readingDate: readingDate.trim() || null,
          imp_r1: parseNum(meterValues.imp_r1 ?? ""),
          imp_r2: parseNum(meterValues.imp_r2 ?? ""),
          imp_r3: parseNum(meterValues.imp_r3 ?? ""),
          imp_kva: parseNum(meterValues.imp_kva ?? ""),
          imp_kvah: parseNum(meterValues.imp_kvah ?? ""),
          exp_r1: parseNum(meterValues.exp_r1 ?? ""),
          exp_r2: parseNum(meterValues.exp_r2 ?? ""),
          exp_r3: parseNum(meterValues.exp_r3 ?? ""),
          exp_kva: parseNum(meterValues.exp_kva ?? ""),
          exp_kvah: parseNum(meterValues.exp_kvah ?? ""),
          imp_exp_r1: parseNum(meterValues.imp_exp_r1 ?? ""),
          imp_exp_r2: parseNum(meterValues.imp_exp_r2 ?? ""),
          imp_exp_r3: parseNum(meterValues.imp_exp_r3 ?? ""),
          imp_exp_kva: parseNum(meterValues.imp_exp_kva ?? ""),
          imp_exp_kvah: parseNum(meterValues.imp_exp_kvah ?? ""),
        });
        triggerHaptic("success");
        Alert.alert("Success", "Meter readings saved successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } catch (error) {
        console.error("Save reading failed:", error);
        triggerHaptic("error");
        Alert.alert("Save Error", "Failed to save the readings to local storage.");
      }
    }
  };

  // ── Calendar Modal ──
  const renderCalendarModal = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const handlePrevMonth = () => {
      triggerHaptic("light");
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
      else setCurrentMonth(currentMonth - 1);
    };

    const handleNextMonth = () => {
      triggerHaptic("light");
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
      else setCurrentMonth(currentMonth + 1);
    };

    const handleDateSelect = (day: number) => {
      setReadingDate(formatDate(currentYear, currentMonth, day));
      setShowCalendar(false);
      triggerHaptic("success");
    };

    return (
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
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
            <View style={styles.weekdaysRow}>
              {weekDays.map((d, i) => (
                <Text key={i} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                }
                const formatted = formatDate(currentYear, currentMonth, day);
                const isSelected = readingDate === formatted;
                const todayObj = new Date();
                const isToday =
                  formatDate(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()) ===
                  formatted;
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

  const accentColor = NET_TYPE_COLORS[netTypeCategory];

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Customer Profile Card ─────────────────────────── */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#8B0000"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.profileTitle} numberOfLines={1}>
                {customer.customerName || "No Customer Name Available"}
              </Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>ACCOUNT NUMBER</Text>
                <Text style={styles.metaValue} selectable>
                  {customer.accountNumber}
                </Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>METER NUMBER</Text>
                <Text style={styles.metaValue} selectable>
                  {customer.installationId}
                </Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>TARIFF</Text>
                <Text style={styles.metaValue}>{customer.tariff || "N/A"}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>NET TYPE</Text>
                <View style={styles.netTypePill}>
                  <View
                    style={[
                      styles.netTypeDot,
                      { backgroundColor: accentColor },
                    ]}
                  />
                  <Text style={[styles.netTypeValue, { color: accentColor }]}>
                    {NET_TYPE_LABELS[netTypeCategory]}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Section Label ─────────────────────────────────── */}
          <Text style={styles.sectionHeader}>ENTER METER READINGS</Text>

          {/* ══════════════════════════════════════════════════════
              TEMPLATE 1: Normal / Unknown
              Shows a single current reading + remarks
          ═══════════════════════════════════════════════════════ */}
          {netTypeCategory === "normal" && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Reading</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusField === "currentReading" && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="speedometer-outline"
                    size={20}
                    color={focusField === "currentReading" ? "#1062FE" : "#94A3B8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter current meter reading"
                    value={currentReading}
                    onChangeText={setCurrentReading}
                    keyboardType="numeric"
                    onFocus={() => { setFocusField("currentReading"); triggerHaptic("light"); }}
                    onBlur={() => setFocusField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Remarks / Exceptions (Optional)</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusField === "remarks" && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color={focusField === "remarks" ? "#1062FE" : "#94A3B8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter remarks or anomalies"
                    value={remarks}
                    onChangeText={setRemarks}
                    onFocus={() => { setFocusField("remarks"); triggerHaptic("light"); }}
                    onBlur={() => setFocusField(null)}
                  />
                </View>
              </View>

              {/* Reading Date */}
              {renderDateField()}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              TEMPLATE 2 & 3 & 4: Net Metering / Net Accounting / Net++
              Import (seq=1) + Export (seq=2)
          ═══════════════════════════════════════════════════════ */}
          {(netTypeCategory === "net_metering" ||
            netTypeCategory === "net_accounting" ||
            netTypeCategory === "net_plus_plus") && (
            <>
              {/* Import Meter - seq 1 */}
              <MeterSection
                title="Import Meter Reading"
                subtitle="Import"
                mtrSeq={1}
                accentColor="#1062FE"
                iconName="arrow-down-circle-outline"
                prefix="imp"
                values={meterValues}
                setValues={setMeterValues}
                focusField={focusField}
                setFocusField={setFocusField}
                onHaptic={() => triggerHaptic("light")}
              />

              {/* Export Meter - seq 2 */}
              <MeterSection
                title="Export Meter Reading"
                subtitle="Export"
                mtrSeq={2}
                accentColor="#1EAF45"
                iconName="arrow-up-circle-outline"
                prefix="exp"
                values={meterValues}
                setValues={setMeterValues}
                focusField={focusField}
                setFocusField={setFocusField}
                onHaptic={() => triggerHaptic("light")}
              />

              {/* Reading Date */}
              <View style={styles.formContainer}>
                {renderDateField()}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              TEMPLATE 5: Net +
              Import (seq=1) + Export (seq=2) + Import-in-Export (seq=3)
          ═══════════════════════════════════════════════════════ */}
          {netTypeCategory === "net_plus" && (
            <>
              {/* Import Meter - seq 1 */}
              <MeterSection
                title="Import Meter Reading"
                subtitle="Import"
                mtrSeq={1}
                accentColor="#1062FE"
                iconName="arrow-down-circle-outline"
                prefix="imp"
                values={meterValues}
                setValues={setMeterValues}
                focusField={focusField}
                setFocusField={setFocusField}
                onHaptic={() => triggerHaptic("light")}
              />

              {/* Export Meter - seq 2 */}
              <MeterSection
                title="Export Meter Reading"
                subtitle="Export"
                mtrSeq={2}
                accentColor="#1EAF45"
                iconName="arrow-up-circle-outline"
                prefix="exp"
                values={meterValues}
                setValues={setMeterValues}
                focusField={focusField}
                setFocusField={setFocusField}
                onHaptic={() => triggerHaptic("light")}
              />

              {/* Import-in-Export Meter - seq 3 */}
              <MeterSection
                title="Import-in-Export Meter Reading"
                subtitle="Import in Export"
                mtrSeq={3}
                accentColor="#E65100"
                iconName="swap-vertical-outline"
                prefix="imp_exp"
                values={meterValues}
                setValues={setMeterValues}
                focusField={focusField}
                setFocusField={setFocusField}
                onHaptic={() => triggerHaptic("light")}
              />

              {/* Reading Date */}
              <View style={styles.formContainer}>
                {renderDateField()}
              </View>
            </>
          )}

          {/* ── Submit Button ─────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: accentColor === "#64748B" ? "#8B0000" : accentColor }]}
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

  // ── Inline date field renderer (used inside each template block) ──
  function renderDateField() {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Reading Date</Text>
        <View
          style={[
            styles.inputWrapper,
            focusField === "date" && styles.inputWrapperFocused,
          ]}
        >
          <TouchableOpacity
            onPress={() => { setShowCalendar(true); triggerHaptic("light"); }}
            style={{ marginRight: 6 }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={showCalendar ? "#1062FE" : "#94A3B8"}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            value={readingDate}
            onChangeText={setReadingDate}
            onFocus={() => { setFocusField("date"); triggerHaptic("light"); }}
            onBlur={() => setFocusField(null)}
          />
          <TouchableOpacity
            onPress={() => { setShowCalendar(true); triggerHaptic("light"); }}
          >
            <Ionicons name="chevron-down-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  keyboardView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { fontSize: 16, color: "#64748B" },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // ── Profile Card ──
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
  metaCell: { width: "48%", marginBottom: 12 },
  metaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 13, fontWeight: "600", color: "#334155" },
  netTypePill: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  netTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  netTypeValue: { fontSize: 13, fontWeight: "700" },

  // ── Section Header ──
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 10,
    letterSpacing: 1,
    paddingLeft: 4,
  },

  // ── Form Container (Normal type) ──
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
    marginBottom: 16,
  },

  // ── Multi-Sequence Section Card ──
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionCardSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  // ── Input Fields ──
  inputGroup: { marginBottom: 14 },
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
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  // ── Submit Button ──
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  submitButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  // ── Calendar Modal ──
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
  dayCellEmpty: { width: 36, height: 36, marginVertical: 4 },
  dayCellSelected: { backgroundColor: "#8B0000" },
  dayCellToday: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  dayText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  dayTextSelected: { color: "#FFFFFF" },
  dayTextToday: { color: "#8B0000" },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 14, fontWeight: "700", color: "#475569" },
});
