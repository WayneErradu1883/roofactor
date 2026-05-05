import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#22c55e",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  dateBlock: {
    textAlign: "right" as const,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: {
    color: "#666",
  },
  value: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  col1: { width: "20%" },
  col2: { width: "25%" },
  col3: { width: "25%" },
  col4: { width: "30%", textAlign: "right" as const },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#22c55e",
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
  },
  confidenceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    alignSelf: "flex-start" as const,
  },
  notes: {
    marginTop: 6,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute" as const,
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  footerLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  footerLogo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  footerBrand: {
    fontSize: 8,
    color: "#999",
  },
  footerRight: {
    fontSize: 7,
    color: "#aaa",
    textAlign: "right" as const,
    maxWidth: 220,
  },
});

interface ZoneInfo {
  zone: number;
  pitchDegrees: number;
  footprintAreaM2: number;
  surfaceAreaM2: number;
}

interface QuoteDocumentProps {
  address: string;
  latitude: number;
  longitude: number;
  footprintAreaM2: number;
  surfaceAreaM2: number;
  pitchDegrees: number;
  ratePerM2: number | null;
  totalCost: number | null;
  confidenceScore: number | null;
  sourcesUsed: string[];
  notes: string | null;
  zones: ZoneInfo[];
  createdAt: string;
  estimatorName: string;
}

function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pitchMultiplier(degrees: number): number {
  if (degrees <= 0) return 1;
  return 1 / Math.cos((degrees * Math.PI) / 180);
}

export default function QuoteDocument({
  address,
  footprintAreaM2,
  surfaceAreaM2,
  ratePerM2,
  totalCost,
  confidenceScore,
  sourcesUsed,
  notes,
  zones,
  createdAt,
  estimatorName,
}: QuoteDocumentProps) {
  const confidenceLabel =
    confidenceScore !== null
      ? confidenceScore >= 0.9
        ? "High"
        : confidenceScore >= 0.7
          ? "Medium"
          : "Low"
      : null;

  const confidenceColor =
    confidenceLabel === "High"
      ? "#dcfce7"
      : confidenceLabel === "Medium"
        ? "#fef3c7"
        : "#fee2e2";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{"\u2302"} Roofactor</Text>
            <Text style={styles.subtitle}>Roof Area Estimate &amp; Quote</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text>Date: {new Date(createdAt).toLocaleDateString("en-ZA")}</Text>
            <Text style={{ marginTop: 2 }}>Estimator: {estimatorName}</Text>
          </View>
        </View>

        {/* Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{address}</Text>
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Footprint (2D):</Text>
            <Text style={styles.value}>{footprintAreaM2.toFixed(1)} m²</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Surface Area (with pitch):</Text>
            <Text style={styles.value}>{surfaceAreaM2.toFixed(1)} m²</Text>
          </View>

          {/* Zone breakdown */}
          {zones.length > 1 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, { fontFamily: "Helvetica-Bold" }]}>
                  Zone
                </Text>
                <Text style={[styles.col2, { fontFamily: "Helvetica-Bold" }]}>
                  Footprint
                </Text>
                <Text style={[styles.col3, { fontFamily: "Helvetica-Bold" }]}>
                  Pitch
                </Text>
                <Text style={[styles.col4, { fontFamily: "Helvetica-Bold" }]}>
                  Surface Area
                </Text>
              </View>
              {zones.map((z) => (
                <View key={z.zone} style={styles.tableRow}>
                  <Text style={styles.col1}>Zone {z.zone}</Text>
                  <Text style={styles.col2}>
                    {z.footprintAreaM2.toFixed(1)} m²
                  </Text>
                  <Text style={styles.col3}>
                    {z.pitchDegrees}° (x{pitchMultiplier(z.pitchDegrees).toFixed(3)})
                  </Text>
                  <Text style={styles.col4}>
                    {z.surfaceAreaM2.toFixed(1)} m²
                  </Text>
                </View>
              ))}
            </View>
          )}

          {zones.length <= 1 && zones.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Pitch:</Text>
              <Text style={styles.value}>
                {zones[0].pitchDegrees}° (x
                {pitchMultiplier(zones[0].pitchDegrees).toFixed(3)})
              </Text>
            </View>
          )}
        </View>

        {/* Cost Estimate */}
        {ratePerM2 && totalCost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Estimate</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Surface Area:</Text>
              <Text>{surfaceAreaM2.toFixed(1)} m²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Rate per m²:</Text>
              <Text>{formatCurrency(ratePerM2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalCost)}</Text>
            </View>
          </View>
        )}

        {/* Data Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Quality</Text>
          {confidenceLabel && (
            <View
              style={[
                styles.confidenceBadge,
                { backgroundColor: confidenceColor },
              ]}
            >
              <Text>{confidenceLabel} Confidence</Text>
            </View>
          )}
          {sourcesUsed.length > 0 && (
            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={styles.label}>Data Sources:</Text>
              <Text>{sourcesUsed.join(", ")}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notes}>
              <Text>{notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLogo}>{"\u2302"} Roofactor</Text>
            <Text style={styles.footerBrand}>powered for Nomiplex 2026</Text>
          </View>
          <Text style={styles.footerRight}>
            Roof area measurements are estimates based on satellite imagery
            and building footprint data. Actual measurements may vary.
            This quote is valid for 30 days from the date above.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
