# Hostinger (frontend) + Railway (backend)

Your app is **Create React App** (uses `react-scripts`, **not Vite**). Use **`REACT_APP_API_URL`** in env files.

- Env files must live in the **`frontend/`** folder.
- The API base URL is set at **build time** via `REACT_APP_API_URL` (or `public/api-config.js` at runtime).
- The Express API runs on **Railway**; only **static files** from `build/` go to **Hostinger**.

## 1) Railway — backend

1. Deploy the **backend** on Railway; copy the public domain from **Settings → Networking**.
2. In Railway **Variables**, set at least:
   - `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `HOST=0.0.0.0`
   - **`FRONTEND_URL`** = `https://www.bazaar-pk.com,https://bazaar-pk.com`
3. Redeploy after changing env.

## 2) Local — production frontend build

1. Copy `.env.production.example` to **`.env.production`** (gitignored).
2. Edit **`.env.production`**:
   - **`REACT_APP_API_URL`** = your Railway URL, **no** trailing slash  
     Example: `REACT_APP_API_URL=https://nova-ecommerce-project-backend-production.up.railway.app`
   - **`REACT_APP_SITE_URL`** = `https://www.bazaar-pk.com`
3. Regenerate SEO files (after catalog changes):

   ```bash
   cd frontend
   FRONTEND_URL=https://www.bazaar-pk.com npm run sitemap
   npm run build
   ```

4. Upload **everything inside** `build/` to Hostinger **`public_html`**, including `.htaccess`, `robots.txt`, `sitemap.xml`, and **`api-config.js`**.

## 3) Google Search Console

1. Add property **`https://www.bazaar-pk.com`** (URL prefix).
2. Verify via **DNS** (Hostinger → DNS → TXT record) — easiest, no code change — **or** HTML tag in `public/index.html`.
3. Submit sitemap: **`https://www.bazaar-pk.com/sitemap.xml`**
4. Do **not** submit the Railway API domain as a sitemap.

## 4) Quick fix without rebuild (`api-config.js`)

Edit **`public/api-config.js`** (or `build/api-config.js` on Hostinger) to set `window.__REACT_APP_API_URL__` to your Railway domain, then hard-refresh (Ctrl+F5).

## 5) Checklist

| Check |  |
|--------|--|
| Build used `.env.production` with real Railway `REACT_APP_API_URL` | Required |
| `REACT_APP_SITE_URL=https://www.bazaar-pk.com` | SEO / canonical |
| Railway `FRONTEND_URL` includes www first | CORS + sitemap |
| `build/` + `.htaccess` + `robots.txt` + `sitemap.xml` uploaded | GSC |
| Network tab shows `*.railway.app`, not `localhost` | Verify |

## 6) If API calls fail

- **CORS**: match Railway `FRONTEND_URL` to the exact site origin (https, www).
- Test backend: `https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health`
