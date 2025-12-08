# HTTPS Setup for Local Development (iPhone Camera Access)

## Problem
iPhone Safari blocks camera access on HTTP (insecure) sites. When accessing via network IP (`192.168.68.126`), the site uses HTTP, so camera won't work.

## Solution Options

### Option 1: Enable Camera Permission in Safari (Quick Fix)
1. On iPhone, open Safari and go to `http://192.168.68.126:3000/scan-test`
2. Tap the **"AA"** icon in the address bar
3. Select **Website Settings**
4. Under **Camera**, select **Allow**
5. Refresh the page

**Note:** This may still show warnings, but should allow camera access.

### Option 2: Set Up HTTPS Locally (Recommended)

#### Install mkcert
```bash
# macOS
brew install mkcert
brew install nss # for Firefox

# Create local CA
mkcert -install
```

#### Generate SSL Certificate
```bash
cd /Users/jordanschepton/Documents/GitHub/Antigravity/book-scanner-app
mkcert -key-file key.pem -cert-file cert.pem localhost 192.168.68.126 ::1
```

#### Update Next.js to Use HTTPS
Create `server.js` in project root:
```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`)
  })
})
```

#### Update package.json
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev"
  }
}
```

#### Access via HTTPS
- Mac: `https://localhost:3000`
- iPhone: `https://192.168.68.126:3000` (accept certificate warning once)

### Option 3: Use ngrok (Easiest for Testing)

```bash
# Install ngrok
brew install ngrok

# Start Next.js dev server
npm run dev

# In another terminal, create tunnel
ngrok http 3000
```

Then use the HTTPS URL ngrok provides (e.g., `https://abc123.ngrok.io`)

### Option 4: Use Cloudflare Tunnel (Free Alternative)

```bash
# Install cloudflared
brew install cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:3000
```

## Recommended: Quick Safari Permission Fix

For now, the easiest solution is to enable camera permissions in Safari:

1. Open Safari on iPhone
2. Go to `http://192.168.68.126:3000/scan-test`
3. Tap **AA** → **Website Settings** → **Camera** → **Allow**
4. Refresh page

This should work, though you may see security warnings.

