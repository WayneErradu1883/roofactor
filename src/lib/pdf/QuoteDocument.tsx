import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Fonts are bundled under /public/fonts and registered once at module load
// (never inside a click handler). Two registrations are needed:
//
// 1. The "Montserrat" family (weight/style faces) — used to render the document
//    body. react-pdf only downloads fonts the document references, so rendering
//    the body in Montserrat guarantees these faces are loaded before layout.
Font.register({
  family: "Montserrat",
  fonts: [
    { src: "/fonts/Montserrat-Regular.ttf" },
    { src: "/fonts/Montserrat-Bold.ttf", fontWeight: "bold" },
    { src: "/fonts/Montserrat-Italic.ttf", fontStyle: "italic" },
    {
      src: "/fonts/Montserrat-BoldItalic.ttf",
      fontWeight: "bold",
      fontStyle: "italic",
    },
  ],
});

// 2. The same faces under their PostScript names. The company logo is an SVG
//    whose text sets font-family to PostScript names like "Montserrat-BoldItalic".
//    react-pdf resolves those as literal family names, so without these it throws
//    "Font family not registered: 'Montserrat-BoldItalic'" while rendering the
//    logo and aborts the entire PDF. (Verified: this exact registration is what
//    stops the crash.)
for (const face of ["Regular", "Bold", "Italic", "BoldItalic"] as const) {
  Font.register({
    family: `Montserrat-${face}`,
    fonts: [{ src: `/fonts/Montserrat-${face}.ttf` }],
  });
}

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
    fontFamily: "Montserrat",
    fontSize: 10,
    color: dark,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: green,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerColLeft: {
    width: "33%",
    alignItems: "flex-start" as const,
    justifyContent: "center" as const,
  },
  headerColCenter: {
    width: "34%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerColRight: {
    width: "33%",
    textAlign: "right" as const,
    alignItems: "flex-end" as const,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    color: dark,
    textAlign: "center" as const,
  },
  brandTagline: {
    fontSize: 8,
    color: gray400,
    marginTop: 2,
    textAlign: "center" as const,
  },
  docLabel: {
    fontSize: 18,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    color: green,
    letterSpacing: 2,
  },
  quoteNumber: {
    fontSize: 10,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    color: dark,
    marginTop: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: gray600,
    marginTop: 2,
  },
  companyLogoImg: {
    height: 40,
    maxWidth: 150,
    objectFit: "contain" as const,
  },
  companyNameText: {
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    color: gray600,
  },

  /* ── Sections ───────────────────────────────────── */
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    fontFamily: "Montserrat",
    fontWeight: "bold",
    color: dark,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    fontFamily: "Montserrat",
    fontStyle: "italic",
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
    fontFamily: "Montserrat",
    fontWeight: "bold",
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
    maxWidth: 250,
  },
});

interface ZoneInfo {
  zone: number;
  pitchDegrees: number;
  footprintAreaM2: number;
  surfaceAreaM2: number;
}

export interface PdfBranding {
  companyName: string;
  companyTagline: string;
  companyLogo: string | null;
  documentTitle: string;
  termsAndConditions: string | null;
  footerText: string;
  quoteValidityDays: number;
  contactPhone: string | null;
  contactEmail: string | null;
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
  branding?: PdfBranding;
}

const DEFAULT_BRANDING: PdfBranding = {
  companyName: "",
  companyTagline: "Professional Roof Coating Solutions",
  companyLogo: null,
  documentTitle: "QUOTATION",
  termsAndConditions:
    "This is a Desktop Estimate, pending a Site Visit.\nThis quotation is valid for {validity} days from the date above. Pricing is subject to change following on-site inspection. Final measurements will be confirmed during the site visit.",
  footerText: "powered for Nomiplex 2026",
  quoteValidityDays: 30,
  contactPhone: null,
  contactEmail: null,
};

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
  branding: brandingProp,
}: QuoteDocumentProps) {
  const b = { ...DEFAULT_BRANDING, ...brandingProp };

  // Replace {validity} placeholder in terms
  const termsText = b.termsAndConditions
    ? b.termsAndConditions.replace(/\{validity\}/g, String(b.quoteValidityDays))
    : null;

  // Filter out internal measurement summary from notes
  const customerNotes =
    notes
      ?.split("\n\n")
      .filter((block) => !block.startsWith("--- Measurement Summary ---"))
      .join("\n\n")
      .trim() || null;

  // Build footer contact line
  const contactParts: string[] = [];
  if (b.contactPhone) contactParts.push(b.contactPhone);
  if (b.contactEmail) contactParts.push(b.contactEmail);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          {/* One row, three evenly balanced columns:
              company logo (left) — Roofactor (center) — document title (right) */}
          <View style={styles.headerTop}>
            {/* Left: company logo (e.g. Nomiplex) */}
            <View style={styles.headerColLeft}>
              {b.companyLogo ? (
                <Image src={b.companyLogo} style={styles.companyLogoImg} />
              ) : b.companyName ? (
                <Text style={styles.companyNameText}>{b.companyName}</Text>
              ) : null}
            </View>

            {/* Center: Roofactor brand */}
            <View style={styles.headerColCenter}>
              <Text style={styles.brandName}>Roofactor</Text>
              <Text style={styles.brandTagline}>{b.companyTagline}</Text>
            </View>

            {/* Right: document title + meta */}
            <View style={styles.headerColRight}>
              <Text style={styles.docLabel}>{b.documentTitle}</Text>
              {quoteNumber && (
                <Text style={styles.quoteNumber}>{quoteNumber}</Text>
              )}
              <Text style={styles.headerMeta}>
                Date: {new Date(createdAt).toLocaleDateString("en-ZA")}
              </Text>
              <Text style={styles.headerMeta}>
                Prepared by: {estimatorName}
              </Text>
            </View>
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
                  <Text style={[styles.col4, { fontFamily: "Montserrat", fontWeight: "bold" }]}>
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
        {termsText && (
          <View style={styles.termsSection}>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Montserrat",
    fontWeight: "bold",
                color: dark,
                marginBottom: 4,
              }}
            >
              Terms &amp; Conditions
            </Text>
            {termsText.split("\n").map((line, i) => (
              <Text
                key={i}
                style={[styles.termsText, i > 0 ? { marginTop: 2 } : {}]}
              >
                {line}
              </Text>
            ))}
          </View>
        )}

        {/* ── Footer ─────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLogo}>
              Roofactor
            </Text>
            <Text style={styles.footerBrand}>{b.footerText}</Text>
          </View>
          <View>
            {contactParts.length > 0 && (
              <Text style={styles.footerRight}>
                {contactParts.join(" | ")}
              </Text>
            )}
            <Text style={styles.footerRight}>
              Roof area measurements are estimates based on satellite imagery
              and building footprint data.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
