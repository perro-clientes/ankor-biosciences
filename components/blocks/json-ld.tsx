/**
 * Inserta datos estructurados schema.org. Escapa "<" para que el contenido
 * no pueda cerrar el <script> (recomendación de la guía de JSON-LD de Next).
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export { JsonLd };
