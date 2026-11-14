/*
 * Everything that depends on Fab's page markup lives here.
 * If Fab redesigns its site and the claimer stops finding buttons,
 * this is the only file that should need changes. See README.md.
 */
globalThis.MSC = {
  origin: 'https://www.fab.com',
  catalogUrl: 'https://www.fab.com/sellers/Quixel%20Megascans?is_free=1&lang=en',
  sellerPath: '/sellers/Quixel Megascans',

  // A product card in the catalog grid. Fab's class names are generated, so a
  // fallback (closest ancestor that holds only one listing) is used when this
  // stops matching.
  card: 'div[class~="nTa5u2sc"]',
  listingLink: 'a[href^="/listings/"]',
  productLink: 'a[href^="/listings/"], a[href^="/bundles/"]',

  // Proof that the Free filter is applied on the catalog page.
  freeFilterChip: '[aria-label="Remove Free"]',

  // Claim button on a hovered catalog card.
  cardAddButton: 'button[aria-label="Add to My Library"]',

  // Text Fab shows. Kept as text because these are the most stable hooks.
  text: {
    owned: /Saved in My Library/,
    free: /\bFree\b/,
    addButton: 'Add to My Library',
    viewInLibrary: 'View in My Library',
    freePriceHeading: 'Free',
    noResults: /no results found/i,
    rateLimited: /too many requests|rate limit|try again later/i,
    signIn: /^(sign in|sign up|log in)$/i,   // shown in Fab's header only when signed out
    resultCount: /([\d][\d,.\s]*)\s+(results?|products?|items?)\b/i
  },
  alerts: '[role="alert"]'
};
