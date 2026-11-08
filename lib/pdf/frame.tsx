import { Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { FDA_DISCLAIMER } from "./coa-defaults";
import { LOGO, LOGO_VIEWBOX, MARK, MARK_VIEWBOX, type SvgShape } from "./logo-shapes";
import { colors, fonts } from "./theme";

/**
 * Piezas comunes a todas las páginas (hoja membretada del Lote Prueba):
 * logo, marca de agua y pie con el disclaimer de la FDA.
 */

function Shapes({ shapes, fill }: { shapes: SvgShape[]; fill: string }) {
  return (
    <>
      {shapes.map((s, i) =>
        s.tag === "path" ? (
          <Path key={i} d={s.d} fill={fill} />
        ) : (
          <Rect
            key={i}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            transform={s.transform}
            fill={fill}
          />
        ),
      )}
    </>
  );
}

/** Logotipo completo. Ancho del original: ~484 pt. */
export function Logo({ width = 484 }: { width?: number }) {
  const height = (width * 71.06) / 406.56;
  return (
    <Svg viewBox={LOGO_VIEWBOX} style={{ width, height }}>
      <Shapes shapes={LOGO} fill={colors.ink} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  watermark: {
    position: "absolute",
    top: 238,
    left: 96,
    width: 407,
    height: 470,
  },
  footer: {
    position: "absolute",
    left: 23,
    right: 15,
    bottom: 12,
  },
  footerBatch: {
    fontFamily: fonts.ui,
    fontWeight: 700,
    fontSize: 11,
    textAlign: "right",
    lineHeight: 1.3,
    marginBottom: 22,
  },
  fda: {
    fontFamily: fonts.text,
    fontSize: 6.9,
    lineHeight: 1.25,
    color: colors.ink,
  },
});

/** Hexágono de fondo, en cada página, detrás del contenido. */
export function Watermark() {
  return (
    <View fixed style={styles.watermark}>
      <Svg viewBox={MARK_VIEWBOX} style={{ width: 407, height: 470 }}>
        <Shapes shapes={MARK} fill={colors.watermark} />
      </Svg>
    </View>
  );
}

/** Pie fijo: lote y vencimiento (si hay datos) + disclaimer FDA. */
export function Footer({ lines }: { lines?: string[] }) {
  return (
    <View fixed style={styles.footer}>
      {lines && lines.length > 0 && (
        <View style={styles.footerBatch}>
          {lines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>
      )}
      <Text style={styles.fda}>{FDA_DISCLAIMER}</Text>
    </View>
  );
}
