# Hostinger (frontend) + Render (backend)

Your app is **Create React App** (uses `react-scripts`, **not Vite**). So use **`REACT_APP_API_URL`** in env files — **not** `VITE_API_URL` / `import.meta.env` (those only work after a full Vite migration).

- Env files must live in the **`frontend/`** folder. A **`.env` in the parent repo root is ignored** by `npm start` / `npm run build` when you run them inside `frontend/`.

The API base URL is **baked in at build time** via `REACT_APP_API_URL` (or `public/api-config.js` at runtime). The Express API runs on **Render**; only **static files** from `build/` go to **Hostinger**.

## 1) Render — backend

1. Deploy your **backend** repo on Render; note the public URL, e.g. `https://nova-ecommerce-project-backend.onrender.com`.
2. In Render **Environment**, set at least:
   - `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
   - **`FRONTEND_URL`** = your live site with **https**, e.g. `https://ebadahgroup.com`  
     (no trailing slash; for `www` you can add both in code or use a comma list — this repo’s `server.js` already allows `https://ebadahgroup.com` and `https://www.ebadahgroup.com` plus any origins listed in `FRONTEND_URL`).
3. Redeploy the service after changing env.

## 2) Local — production frontend build

1. In the `frontend` folder, **copy** `.env.production.example` to **`.env.production`** (this file is gitignored).
2. Edit **`.env.production`**:
   - **`REACT_APP_API_URL`** = your Render service URL, **no** trailing slash  
     Example: `REACT_APP_API_URL=https://nova-ecommerce-project-backend.onrender.com`
   - **`REACT_APP_SITE_URL`** = your Hostinger domain, **https**, no trailing slash  
     Example: `REACT_APP_SITE_URL=https://ebadahgroup.com`
3. From `frontend/`, run:

   ```bash
   npm run build
   ```

4. Upload **everything inside** the generated **`build/`** folder to Hostinger **`public_html`** (or the subdomain’s web root), **including** `.htaccess` so client-side routes (e.g. `/shop/...`) work on refresh.

## 3) Hostinger — .htaccess

`public/.htaccess` is copied into `build/.htaccess` on build. If you upload by hand, ensure the same rules exist on the server (see `public/.htaccess` in this repo). **RewriteBase** should be `/` if the site is at the domain root; for a subfolder, set `RewriteBase` and CRA `homepage` accordingly.

## 4) Checklist

| Check |  |
|--------|--|
| Build used `.env.production` with real `REACT_APP_API_URL` | Required |
| Render `FRONTEND_URL` matches your site | CORS + redirects |
| `build/` contents + `.htaccess` uploaded | SPA routing |
| Stripe live keys in `.env.production` when you go live | Optional |

## 5) Quick fix without a full rebuild (`api-config.js`)

The file **`public/api-config.js`** is copied to **`build/api-config.js`** and loaded **before** the app. It sets `window.__REACT_APP_API_URL__` to your **Render** URL. If products still don’t load after a bad build, open **File Manager** on Hostinger, edit **`api-config.js`** in `public_html` to match your Render service URL, save, hard-refresh the site (Ctrl+F5).  
Then do a full **`npm run build`** so `index.html` and assets stay in sync.

## 6) “Cannot load products / REACT_APP_API_URL” on Hostinger

The live build **embeds the API address when you run `npm run build`**. If you see that message (or no products), usually:

1. **`.env.production`** does not have your **real** Render URL — fix `REACT_APP_API_URL` (not `https://YOUR-SERVICE.onrender.com` / not empty).
2. You **rebuilt** after saving `.env.production` (`npm run build` again) and re-uploaded **`build/`** folder.
3. On **Render**, CORS: use **`FRONTEND_URL`** with your site, e.g. `https://yoursubdomain.hostingersite.com` (comma-separate if needed), or deploy backend after the update that allows `*.hostingersite.com` for previews.

## 7) If API calls still fail

- Open browser **Network** tab: confirm requests go to **https://…onrender.com**, not `localhost`.
- In **Console**, if you see **CORS**: match `FRONTEND_URL` on Render to the **exact** origin in the address bar (including `https` and `www` if used).
- Render free tier: first request can take **~50s** (cold start).
