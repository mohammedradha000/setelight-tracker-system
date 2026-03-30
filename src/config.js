/**
 * Satellite Tracker Centralized Configuration
 * Default branding information and utility functions.
 */

export const CONFIG = {
  branding: {
    label: "BUILT BY",
    name: "FABBEY",
    // Default link if none is saved in LocalStorage
    defaultLink: "https://github.com/mohammedradha000",
  }
};

/**
 * Retrieves the active branding link.
 * Priority: LocalStorage > Default
 */
export function getActiveBrandingLink() {
  const savedLink = localStorage.getItem('fabbey_branding_link');
  if (savedLink) return savedLink;
  return CONFIG.branding.defaultLink;
}

/**
 * Saves a new branding link to LocalStorage.
 */
export function saveBrandingLink(newLink) {
  if (!newLink) return;
  localStorage.setItem('fabbey_branding_link', newLink);
}
