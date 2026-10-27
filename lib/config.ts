/**
 * Institution-level settings. Replace these with the university's real values
 * before going live.
 */
export const SITE = {
  name: "Federal University of Lafia",
  short: "FULafia",
  tagline: "Integrity, Innovation, Excellence",
  /** WhatsApp support line in international format, digits only. Placeholder. */
  supportWhatsApp: "2348000000000",
  supportEmail: "ictsupport@fulafia.edu.ng",
  /** Where "Start your application" sends prospective students. */
  applicationUrl: "https://fulafia.edu.ng",
  website: "https://fulafia.edu.ng",
} as const;

export const whatsappLink = (text = "Hello, I need help with the FULafia student portal.") =>
  `https://wa.me/${SITE.supportWhatsApp}?text=${encodeURIComponent(text)}`;
