/**
 * Gunotsav 2.0 Application - Modular Frontend Script Loader
 * 
 * Note: The application's JavaScript has been refactored and split into modular files:
 * 1. /public/js/config.js      - Static configurations, titles, default tables and constants.
 * 2. /public/public/js/utils.js - Selector shortcuts, HTML escaping, and UI feedback helpers.
 * 3. /public/js/api.js         - Client interface for backend MongoDB + Cloudinary REST endpoints.
 * 4. /public/js/navigation.js  - Dynamic header rendering, navigation tabs, and school bar loading.
 * 5. /public/js/pages/         - Page-specific logic scripts:
 *    - dashboard.js            - Main checklist items selector and editor.
 *    - school.js               - School details editor form.
 *    - reports.js              - Aggregated summary report viewer.
 *    - documents.js            - Centralized documents library grid.
 * 
 * All scripts are loaded via index.html or respective pages inside /pages/.
 */
console.log('Gunotsav 2.0 Modular System Initialized.');
