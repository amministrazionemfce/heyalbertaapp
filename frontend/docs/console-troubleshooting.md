# Browser console noise (not from this app)

If you see these in DevTools, they usually **do not** come from Hey Alberta’s source code:

## `Extension context invalidated` (`index.iife.js`)

- Caused by **browser extensions** (password managers, ad blockers, etc.) after an extension reload/update.
- **Fix:** Hard-refresh the page (`Ctrl+Shift+R` / `Cmd+Shift+R`) or disable extensions to confirm.

## `event.currentTarget is Not HTMLElement Instance` (`installHook.js`)

- Often from **React Developer Tools** or similar dev extensions hooking into React.
- **Fix:** Update React DevTools, refresh, or test in an incognito window with extensions off.

## `Failed to load resource: net::ERR_NETWORK_CHANGED`

- The browser’s network stack retried after a connection change (Wi‑Fi switch, VPN, sleep).
- **Fix:** Refresh. The app loads partner logos from public CDNs; transient failures are normal.

## Logo requests

Partner logos try **Google favicons → DuckDuckGo → Clearbit** (see `src/lib/vendorLogo.js`). Clearbit is last to avoid noisy failures when it is slow or blocked.
