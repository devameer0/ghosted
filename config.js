/*
 * ONE PLACE TO SET THE BOT LINK.
 * Every "Get the bot" button on the site uses this value (app.js reads it).
 *
 * The "Get the bot" link (the "Unfollower Tracker" template share link). `node scripts/check-config.js` warns if it is ever a placeholder.
 * On Netlify / Cloudflare you can instead set a BOT_URL environment variable (see README); the build script writes it here.
 */
var BOT_URL = 'https://x.ai/bot/qg30RLq62kT_Ud04rGNFQ';

/*
 * TIP BUTTON LINK (the small "Tip" link on the landing and example pages).
 * TODO(optional): paste a Ko-fi / Buy Me a Coffee / Stripe Payment Link URL here. While it is the placeholder the Tip link stays HIDDEN.
 * `node scripts/check-config.js` notes it. Env var: TIP_URL (see README).
 */
var TIP_URL = 'https://example.com/REPLACE_WITH_TIP_LINK';
