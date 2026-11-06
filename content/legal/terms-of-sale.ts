// Migrado sin reescribir desde https://ankor-bio.com/sections/legal-3.html
// (scripts de conversión: encabezados → h2 con id, líneas "1." → ol, "* " → ul).
import type { LegalBlock } from "./types";

export const blocks: LegalBlock[] = [
  {
    "type": "ol",
    "items": [
      "Returns are allowed within 14 days.",
      "Returns must be unused and unopened.",
      "Shipping costs will not be refunded.",
      "Customer is responsible for the return shipping costs.",
      "Refunds will not be issued until the product has been confirmed received, but once received every effort must be made to handle the refund same day.",
      "All refunds require RMA.",
      "Disposition of unopened refunded products to be decided.",
      "There is a 15% restocking fee for all product returns."
    ]
  },
  {
    "type": "p",
    "text": "During the checkout process you will be given the complete terms of your purchase. Included in those terms is your clear understanding that we are selling these products as containing CBD (cannabidiol) from hemp oil. These products have not been evaluated by the FDA. We are committed to complete compliance with FDA regulations and as such, because these products have not been evaluated by the FDA, we make no claims as to any extra benefits for products containing CBD (cannabidiol). If you decide to purchase our products, you are drawing your own opinions as to any additional benefits or use these products may provide. Your acceptance of the terms of purchase means you agree to and understand the refund policy."
  },
  {
    "type": "h2",
    "id": "damage-during-shipping",
    "text": "Damage During Shipping"
  },
  {
    "type": "p",
    "text": "We take customer satisfaction very seriously. All of our products are tested for quality, and all shipments are carefully inspected before leaving our warehouse."
  },
  {
    "type": "p",
    "text": "Please check your shipment carefully upon arrival to ensure it has not been damaged during shipping. All claims for damaged product must be made with 72hrs. Please contact us and provide detailed information for any product damaged during shipping within that time."
  },
  {
    "type": "h2",
    "id": "international-orders",
    "text": "International Orders"
  },
  {
    "type": "p",
    "text": "In some countries, you may incur some extra shipping charges for end-point drop off, tax tariffs, and other charges. If purchasing from a country outside of the United States, we implore you to do your own research about these possible charges prior to making a purchase. You will not be reimbursed or refunded based on these extra charges."
  }
];
