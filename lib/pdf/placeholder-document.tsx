import { Document, Page, View } from "@react-pdf/renderer";
import { Footer, Logo, Watermark } from "./frame";
import { colors, fonts, page } from "./theme";

/**
 * PDF placeholder: lo que sirve la URL de un lote recién creado, antes de
 * publicar sus datos. Misma hoja membretada que el Lote Prueba: logo, marca de
 * agua y disclaimer de la FDA.
 */
export function PlaceholderDocument({ lotLabel }: { lotLabel?: string }) {
  return (
    <Document
      title={lotLabel ? `Certificate of Analysis — ${lotLabel}` : "Certificate of Analysis"}
      author="Ankor Biosciences"
      creator="ankor-bio.com"
      producer="ankor-bio.com"
      language="en"
    >
      <Page
        size="A4"
        style={{
          paddingTop: page.paddingTop,
          paddingBottom: page.paddingBottom,
          paddingHorizontal: page.paddingX,
          fontFamily: fonts.ui,
          color: colors.ink,
        }}
      >
        <Watermark />
        <View style={{ alignItems: "center", marginLeft: 8 }}>
          <Logo />
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
