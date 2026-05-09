import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const green = "#22c55e";
const darkGreen = "#16a34a";
const dark = "#111827";
const gray600 = "#4b5563";
const gray400 = "#9ca3af";
const gray200 = "#e5e7eb";
const gray50 = "#f9fafb";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 80,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: dark,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: green,
  },
  headerLeft: {},
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: dark,
  },
  brandTagline: {
    fontSize: 8,
    color: gray400,
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right" as const,
    alignItems: "flex-end" as const,
  },
  docLabel: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: green,
    letterSpacing: 2,
  },
  quoteNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: dark,
    marginTop: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: gray600,
    marginTop: 2,
  },

  /* ── Sections ───────────────────────────────────── */
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: dark,
    paddingBottom: 5,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: green,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    color: gray600,
  },
  value: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: dark,
  },

  /* ── Property ───────────────────────────────────── */
  propertyCard: {
    backgroundColor: gray50,
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: green,
  },
  addressText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: dark,
  },
  coordsText: {
    fontSize: 8,
    color: gray400,
    marginTop: 3,
  },

  /* ── Polygon image ──────────────────────────────── */
  polygonSection: {
    marginBottom: 18,
    alignItems: "center" as const,
  },
  polygonImage: {
    width: 460,
    height: 345,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gray200,
  },
  polygonCaption: {
    fontSize: 8,
    color: gray400,
    marginTop: 4,
    textAlign: "center" as const,
  },

  /* ── Table ──────────────────────────────────────── */
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: dark,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: gray200,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: gray50,
    borderBottomWidth: 1,
    borderBottomColor: gray200,
  },
  col1: { width: "20%" },
  col2: { width: "30%" },
  col3: { width: "20%", textAlign: "center" as const },
  col4: { width: "30%", textAlign: "right" as const },

  /* ── Totals ─────────────────────────────────────── */
  summaryCard: {
    backgroundColor: gray50,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: gray200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: gray600,
  },
  summaryValue: {
    fontSize: 10,
    color: dark,
  },
  totalDivider: {
    borderTopWidth: 2,
    borderTopColor: green,
    marginTop: 8,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: dark,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: darkGreen,
  },

  /* ── Notes ──────────────────────────────────────── */
  notesBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: gray50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: gray200,
  },
  notesText: {
    fontSize: 9,
    color: gray600,
    lineHeight: 1.5,
  },

  /* ── Terms ──────────────────────────────────────── */
  termsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: gray200,
  },
  termsText: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: gray600,
    lineHeight: 1.4,
  },

  /* ── Footer ─────────────────────────────────────── */
  footer: {
    position: "absolute" as const,
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 2,
    borderTopColor: green,
    paddingTop: 8,
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
    color: dark,
  },
  footerBrand: {
    fontSize: 7,
    color: gray400,
  },
  footerRight: {
    fontSize: 7,
    color: gray400,
    textAlign: "right" as const,
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
  notes: string | null;
  zones: ZoneInfo[];
  createdAt: string;
  estimatorName: string;
  quoteNumber?: string;
  polygonImageUrl?: string;
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuoteDocument({
  address,
  latitude,
  longitude,
  footprintAreaM2,
  surfaceAreaM2,
  ratePerM2,
  totalCost,
  notes,
  zones,
  createdAt,
  estimatorName,
  quoteNumber,
  polygonImageUrl,
}: QuoteDocumentProps) {
  // Filter out internal measurement summary from notes
  const customerNotes = notes
    ?.split("\n\n")
    .filter((block) => !block.startsWith("--- Measurement Summary ---"))
    .join("\n\n")
    .trim() || null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>{"\u2302"} Roofactor</Text>
            <Text style={styles.brandTagline}>
              Professional Roof Coating Solutions
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>QUOTATION</Text>
            {quoteNumber && (
              <Text style={styles.quoteNumber}>{quoteNumber}</Text>
            )}
            <Text style={styles.headerMeta}>
              Date: {new Date(createdAt).toLocaleDateString("en-ZA")}
            </Text>
            <Text style={styles.headerMeta}>Prepared by: {estimatorName}</Text>
          </View>
        </View>

        {/* ── Property ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.propertyCard}>
            <Text style={styles.addressText}>{address}</Text>
            <Text style={styles.coordsText}>
              GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* ── Roof Layout ────────────────────────── */}
        {polygonImageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roof Layout</Text>
            <View style={styles.polygonSection}>
              <Image src={polygonImageUrl} style={styles.polygonImage} />
              <Text style={styles.polygonCaption}>
                Satellite view with roof polygon overlay
              </Text>
            </View>
          </View>
        )}

        {/* ── Measurements ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roof Measurements</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Footprint Area (2D):</Text>
            <Text style={styles.value}>{footprintAreaM2.toFixed(1)} m²</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              Total Surface Area (pitch-adjusted):
            </Text>
            <Text style={styles.value}>{surfaceAreaM2.toFixed(1)} m²</Text>
          </View>

          {/* Zone breakdown table */}
          {zones.length > 1 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.col1]}>Zone</Text>
                <Text style={[styles.tableHeaderText, styles.col2]}>
                  Footprint
                </Text>
                <Text style={[styles.tableHeaderText, styles.col3]}>Pitch</Text>
                <Text style={[styles.tableHeaderText, styles.col4]}>
                  Surface Area
                </Text>
              </View>
              {zones.map((z, idx) => (
                <View
                  key={z.zone}
                  style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.col1}>Zone {z.zone}</Text>
                  <Text style={styles.col2}>
                    {z.footprintAreaM2.toFixed(1)} m²
                  </Text>
                  <Text style={styles.col3}>{z.pitchDegrees}°</Text>
                  <Text style={[styles.col4, { fontFamily: "Helvetica-Bold" }]}>
                    {z.surfaceAreaM2.toFixed(1)} m²
                  </Text>
                </View>
              ))}
            </View>
          )}

          {zones.length === 1 && (
            <View style={styles.row}>
              <Text style={styles.label}>Roof Pitch:</Text>
              <Text style={styles.value}>{zones[0].pitchDegrees}°</Text>
            </View>
          )}
        </View>

        {/* ── Quote Summary ──────────────────────── */}
        {ratePerM2 != null && totalCost != null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quote Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Surface Area:</Text>
                <Text style={styles.summaryValue}>
                  {surfaceAreaM2.toFixed(1)} m²
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate per m²:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(ratePerM2)}
                </Text>
              </View>
              <View style={styles.totalDivider}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total (incl.):</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(totalCost)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Notes ──────────────────────────────── */}
        {customerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{customerNotes}</Text>
            </View>
          </View>
        )}

        {/* ── Terms & Conditions ─────────────────── */}
        <View style={styles.termsSection}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: "Helvetica-Bold",
              color: dark,
              marginBottom: 4,
            }}
          >
            Terms &amp; Conditions
          </Text>
          <Text style={styles.termsText}>
            This is a Desktop Estimate, pending a Site Visit.
          </Text>
          <Text style={[styles.termsText, { marginTop: 2 }]}>
            This quotation is valid for 30 days from the date above. Pricing is
            subject to change following on-site inspection. Final measurements
            will be confirmed during the site visit.
          </Text>
        </View>

        {/* ── Footer ─────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLogo}>{"\u2302"} Roofactor</Text>
            <Text style={styles.footerBrand}>powered for Nomiplex 2026</Text>
          </View>
          <Text style={styles.footerRight}>
            Roof area measurements are estimates based on satellite imagery and
            building footprint data.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
