/**
 * Contenido del sitio. Todo el copy y los datos viven acá: las secciones solo
 * renderizan. Copy final tomado de docs/design/home.reference.html.
 */

export type NavLink = { label: string; href: string };
export type SiteImage = { src: string; alt: string; width: number; height: number };

// ─── Datos de la empresa (una sola fuente: home, /contact, footer, JSON-LD) ───

export const site = {
  name: "Ankor Biosciences",
  url: "https://ankor-bio.com",
  tagline:
    "Helping to shape the conditions for consistent and safe hemp-derived products globally.",
  logo: {
    dark: { src: "/brand/anlog-dg.svg", alt: "Ankor Biosciences", width: 407, height: 71 },
    light: { src: "/brand/anlog-wh.svg", alt: "Ankor Biosciences", width: 407, height: 71 },
  },
  // Mismo archivo y alt que app/opengraph-image.jpg / app/twitter-image.jpg (+ .alt.txt).
  ogImage: {
    src: "/opengraph-image.jpg",
    alt: "Person standing in a hemp field at dusk, framed by the Ankor Biosciences hexagon outlines",
    width: 1200,
    height: 630,
  },
} as const;

export const contact = {
  email: "community@ankor-bio.com",
  phone: {
    display: "719-422-2003",
    href: "tel:+17194222003",
    e164: "+1-719-422-2003",
    hours: "Mon–Fri 09.00 to 4 PM MST",
  },
  address: {
    label: "Colorado Springs headquarters · by appointment only",
    building: "Citadel Terrace",
    street: "685 Citadel Drive East",
    city: "Colorado Springs",
    region: "CO",
    postalCode: "80909",
    country: "United States",
    countryCode: "US",
  },
} as const;

// ─── Navegación ───

export const headerNav: NavLink[] = [
  { label: "About us", href: "/#about" },
  { label: "Investors", href: "/#investors" },
  { label: "Product pipeline", href: "/#products" },
  { label: "Advocates community", href: "/#advocates" },
];

export const headerCta: NavLink = { label: "Contact us", href: "/contact" };

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "About us", href: "/#about" },
      { label: "Product pipeline", href: "/#products" },
      { label: "Advocates community", href: "/#advocates" },
      { label: "Investors", href: "/#investors" },
    ],
  },
  {
    title: "Business",
    links: [
      { label: "Business development", href: "/#business" },
      { label: "Export opportunities", href: "/#export" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use agreement", href: "/legal/terms-of-use" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms of sale / refund policy", href: "/legal/terms-of-sale" },
    ],
  },
];

// ─── Disclaimers ───

const fdaText =
  "Food and Drug Administration (FDA) disclosure: these statements have not been evaluated by the FDA and are not intended to diagnose, treat, or cure any disease. Always check with your physician before starting a new dietary supplement program.";

export const disclaimers = {
  fdaShort: fdaText,
  fdaFull: `${fdaText} Leaving our website disclaimer: if we have a research link to a website where we sell products or have product information, the exit disclaimer indicates that when you click OK you will leave ankor-bio.com and visit an external link. Links to any informational websites are provided solely as a service to our users. External links provide additional information that may be useful or interesting and have no affiliation to the promotion, sale and distribution of Ankor Biosciences products. The link does not constitute an endorsement of these organizations by Ankor Biosciences and none should be inferred. Please view our full Terms of Use Agreement for more information and the terms and conditions governing your use of this site.`,
} as const;

// ─── Contacto: temas del formulario (?topic=) ───

export const contactTopics = [
  { value: "general", label: "General inquiry" },
  { value: "product", label: "Product information" },
  { value: "business", label: "Business development" },
  { value: "export", label: "Export opportunities" },
  { value: "investors", label: "Investor relations" },
  { value: "advocates", label: "Advocates community" },
] as const;

export type ContactTopic = (typeof contactTopics)[number]["value"];

export const contactHref = (topic?: ContactTopic, product?: string) => {
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (product) params.set("product", product);
  const query = params.toString();
  return query ? `/contact?${query}` : "/contact";
};

// ─── Home ───

export const hero = {
  titleStart: "Helping to shape the conditions for ",
  titleAccent: "consistent and safe",
  titleEnd: " hemp-derived products, globally.",
  lead: "Bioscience, agriculture, logistics, pharmaceuticals and regulators working together to deliver the best quality and applied sciences.",
  primaryCta: { label: "Business development", href: "#business" },
  secondaryCta: { label: "Export opportunities", href: "#export" },
  // TODO(cliente): la referencia usa back.jpg ("Hemp seedling growing in dark soil"),
  // que no está en public/. Se usa back-4.jpg hasta recibirla.
  image: {
    src: "/others/back-4.jpg",
    alt: "Young hemp plants growing in a greenhouse",
    width: 1920,
    height: 1080,
  },
  // TODO(cliente): confirmar qué sellos incluye logos.svg.
  seals: {
    src: "/others/logos.svg",
    alt: "Certification seals, including USA Grown Hemp",
    width: 307,
    height: 51,
  },
  caption: "From Colorado Springs to each corner, individual and community in need.",
} as const;

export const about = {
  eyebrow: "About us",
  title:
    "A team of humans, with strong roots and passion for the community we choose to globally serve.",
  features: [
    {
      icon: "action",
      title: "A team of action",
      text: "Getting together the best minds in bioscience, agriculture, logistics, pharmaceuticals and regulators to deliver the best quality and applied sciences.",
    },
    {
      icon: "doers",
      title: "A team of doers",
      text: "Helping to shape the conditions and access in remote territories.",
    },
    {
      icon: "hope",
      title: "A team of hope",
      text: "In a quest for a brighter future, from the City of Colorado Springs to each corner, individual and community in need.",
    },
  ],
  image: {
    src: "/others/back-1.jpg",
    alt: "Person walking through a hemp field at sunset",
    width: 1920,
    height: 1080,
  },
} as const;

export type FeatureIcon = (typeof about.features)[number]["icon"];

export const products = {
  eyebrow: "Product pipeline",
  titleLines: ["Full spectrum", "hemp oil."],
  lead: "Three flavours, one standard. Each bottle is concentrated, 3.38 fl oz (100 ml).",
  ctaLabel: "Request information",
  items: [
    {
      slug: "orange",
      flavour: "Orange",
      name: "Full Spectrum Hemp Oil",
      description: "Orange flavour, concentrated 3.38 fl oz (100 ml).",
      image: {
        src: "/others/pack-1.png",
        alt: "Full Spectrum Hemp Oil, orange flavour, 100 ml box",
        width: 386,
        height: 613,
      },
    },
    {
      slug: "lemon",
      flavour: "Lemon",
      name: "Full Spectrum Hemp Oil",
      description: "Lemon flavour, concentrated 3.38 fl oz (100 ml).",
      image: {
        src: "/others/pack-2.png",
        alt: "Full Spectrum Hemp Oil, lemon flavour, 100 ml box",
        width: 386,
        height: 613,
      },
    },
    {
      slug: "peppermint",
      flavour: "Peppermint",
      name: "Full Spectrum Hemp Oil",
      description: "Peppermint flavour, concentrated 3.38 fl oz (100 ml).",
      image: {
        src: "/others/pack-3.png",
        alt: "Full Spectrum Hemp Oil, peppermint flavour, 100 ml box",
        width: 386,
        height: 613,
      },
    },
  ],
} as const;

export const advocates = {
  eyebrow: "Advocates community",
  title: "Safe, pure product where care happens.",
  mission:
    "It is our mission to collaborate with other health care providers to mediate conflict and facilitate positive change, as educators and information specialists empowering others.",
  lead: "Working in direct advocate environments, helping to shape the conditions and the access to a safe and pure product, assuring high quality standards.",
  environments: [
    "Hospitals",
    "Community health centers",
    "Long-term care facilities",
    "Non-profit patient services programs",
    "Private, independent practitioners",
  ],
  ctaIntro: "Let us know how our community can assist your current needs.",
  image: {
    src: "/others/back-2.jpg",
    alt: "Health professionals attending a conference",
    width: 1920,
    height: 1080,
  },
} as const;

export const business = {
  eyebrow: "Business development",
  title: "From growing to extract and packing.",
  lead: "We entail tasks and processes to develop and implement growth opportunities within and between your organization. An A–Z responsive and adaptive partner in the industry for:",
  partners: [
    "Distributors",
    "Wholesalers",
    "Governments and institutions",
    "Hospitals and clinics",
  ],
  cta: { label: "Contact our business development team", href: contactHref("business") },
  image: { src: "/others/back-3.jpg", alt: "", width: 1920, height: 1080 },
} as const;

export const exportOpportunities = {
  eyebrow: "Export opportunities",
  title:
    "Offering our products to communities, advocates, physicians, pharmacies and referral centers around the world.",
  asideTitle: "A–Z business line",
  asideText:
    "Growing solutions, standardized oils, customized formulas and purified preparations. Our experienced team can assist your current needs.",
  cta: { label: "Talk to our team", href: contactHref("export") },
  items: [
    { icon: "documents", text: "Assistance with regulatory documents and certificates" },
    { icon: "updates", text: "Constant information and updates on the industry" },
    {
      icon: "global",
      text: "Dedicated representatives to receive our products into legal jurisdictions",
    },
  ],
} as const;

export type ExportIcon = (typeof exportOpportunities.items)[number]["icon"];

export const investors = {
  eyebrow: "For investors",
  title: "A company in constant growth and development.",
  text: "Through enhanced innovation we provide an exciting product portfolio, delivering value through acquisitions, organic initiatives, and financial performance centered on annual recurring revenue and operating cash flows.",
  cta: { label: "Contact our specialist area", href: contactHref("investors") },
  image: { src: "/others/back-1.jpg", alt: "", width: 1920, height: 1080 },
} as const;

export const contactSection = {
  eyebrow: "Contact us",
  title: "Please direct your inquiries to our team.",
  cta: { label: "Send us a message", href: "/contact" },
  image: {
    src: "/others/side-1.jpg",
    alt: "Citadel Terrace building, Ankor Biosciences headquarters in Colorado Springs",
    width: 1000,
    height: 1000,
  },
} as const;

export const contactPage = {
  eyebrow: "Contact us",
  title: "Please direct your inquiries to our team.",
  lead: "Tell us a bit about your inquiry and the right person on our team will get back to you.",
} as const;

// ─── Legales ───

export const legalPages = {
  "terms-of-use": {
    title: "Terms of Use Agreement",
    navLabel: "Terms of Use",
    source: "/sections/legal-1.html",
    // No inventar fechas: cargar cuando el cliente la confirme (formato ISO, ej. "2026-11-06").
    lastUpdated: null as string | null,
  },
  privacy: {
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    source: "/sections/legal-2.html",
    lastUpdated: null as string | null,
  },
  "terms-of-sale": {
    title: "Terms of Sale & Refund Policy",
    navLabel: "Terms of Sale & Refund Policy",
    source: "/sections/legal-3.html",
    lastUpdated: null as string | null,
  },
} as const;

export type LegalSlug = keyof typeof legalPages;

// ─── Metadata por página ───

export const pageMeta = {
  home: {
    title: "Ankor Biosciences | Full Spectrum Hemp Oil",
    description:
      "Consistent and safe hemp-derived products, globally. Full spectrum hemp oil, business development and export from Colorado Springs.",
  },
  contact: {
    title: "Contact",
    description:
      "Contact Ankor Biosciences for product information, business development, export opportunities and investor relations. Colorado Springs, CO.",
  },
  "terms-of-use": {
    title: "Terms of Use",
    description: "Terms and conditions governing your use of the Ankor Biosciences website.",
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Ankor Biosciences collects, uses and protects your personal information.",
  },
  "terms-of-sale": {
    title: "Terms of Sale & Refund Policy",
    description:
      "Ankor Biosciences terms of sale, refunds, shipping damage and international orders.",
  },
} as const;
