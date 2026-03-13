# lupon-outstream

Outstream video tag served from CDN (Cloudflare Pages).

## URL

- **Production:** `https://cdn.luponmedia.com/outstream/v1/tag.js`
- **Pages default:** `https://lupon-outstream.pages.dev/outstream/v1/tag.js`

## Setup (one-time)

### 1. GitHub

- Create repo **lupondev/lupon-outstream** on GitHub (empty, no README).
- Add secrets for the deploy workflow:
  - `CLOUDFLARE_API_TOKEN` — API token with **Cloudflare Pages Edit**.
  - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.

Then push this folder:

```bash
cd lupon-outstream
git init
git add .
git commit -m "Initial: outstream tag, wrangler, deploy workflow"
git remote add origin https://github.com/lupondev/lupon-outstream.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Pages

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Choose **lupondev/lupon-outstream**, branch **main**.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/` (root)
4. Save. Project name will be **lupon-outstream**; production URL `https://lupon-outstream.pages.dev`.

### 3. Custom domain

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter **cdn.luponmedia.com** and complete the flow.
3. In **DNS** (zone for `luponmedia.com`), add or confirm:
   - **Type:** CNAME  
   - **Name:** `cdn`  
   - **Target:** `lupon-outstream.pages.dev`  
   - **Proxy:** optional (orange cloud).

## Verify

After deploy:

```bash
curl -sI https://cdn.luponmedia.com/outstream/v1/tag.js
```

Expect: `Content-Type: application/javascript` (and 200).

## Local

```bash
npx wrangler pages dev . --port 8788
```

Then open: `http://localhost:8788/outstream/v1/tag.js`
