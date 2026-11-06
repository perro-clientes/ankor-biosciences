import { createCn } from "cn/config";

/**
 * cn con los tokens propios de globals.css registrados, para que el merge
 * no confunda tamaños (text-body) con colores (text-ink-muted).
 */
export const cn = createCn({
  extend: {
    theme: {
      text: [
        "display",
        "section",
        "statement",
        "h3",
        "h3-sm",
        "item",
        "body",
        "body-sm",
        "reading",
        "eyebrow",
        "button",
        "caption",
      ],
      radius: ["pill", "inner", "card", "card-lg", "image"],
      spacing: ["target", "section", "section-sm"],
      container: ["site"],
    },
  },
});
