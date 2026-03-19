# ScienceLogic EM7 — Mobile PWA

Een installeerbare Progressive Web App voor ScienceLogic EM7 event management.
Ondersteunt Basic Auth, API Token, OAuth2/OIDC en SAML 2.0.

---

## 🚀 Deployment naar GitHub Pages (5 minuten)

### Step 1 — GitHub repository aanmaken
1. Ga naar [github.com](https://github.com) en log in (of maak een gratis account aan)
2. Klik op **"New repository"** (groene knop top right)
3. Naam: `sciencelogic-app`
4. Set to **Public** (required for free GitHub Pages)
5. Klik **"Create repository"**

### Step 2 — Upload files
1. In your new repository, click **"uploading an existing file"**
2. Drag ALL files en mappen uit deze zip naar het uploadvenster
3. Make sure the folder structure is preserved:
   ```
   .github/workflows/deploy.yml
   src/
   public/
   index.html
   package.json
   vite.config.js
   ```
4. Klik **"Commit changes"**

### Step 3 — Enable GitHub Pages
1. Go to your repository → **Settings** → **Pages** (linkermenu)
2. Bij **Source**: choose **"GitHub Actions"**
3. Klik **Save**

### Step 4 — Wait for deployment
1. Ga naar **Actions** tab in je repository
2. You will see a workflow running (orange dot = running, green = done)
3. Takes about 2 minutes

### Step 5 — Open the app
Your app is now live at:
```
https://JOUW-GEBRUIKERSNAAM.github.io/sciencelogic-app/
```

---

## 📱 Install as app on phone

### iPhone (Safari)
1. Open de URL in **Safari** (not Chrome!)
2. Tik op het **deel-icoontje** (square with upward arrow)
3. Scroll down → **"Set to beginscherm"**
4. Tik **"Add"**

### Android (Chrome)
1. Open de URL in **Chrome**
2. Tik op de **drie puntjes** top right
3. Kies **"Toevoegen aan startscherm"** of **"App installeren"**
4. Tik **"Installeren"**

---

## 🔐 SSO Configuration

### OAuth2 / OpenID Connect (Azure AD, Okta)
- **Client ID**: App registratie client ID
- **Authorization URL**:
  - Azure AD: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize`
  - Okta: `https://{domein}.okta.com/oauth2/v1/authorize`
- **Token URL**:
  - Azure AD: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`
- **Redirect URI**: `https://JOUW-NAAM.github.io/sciencelogic-app/`
  - Registreer deze URI in je identity provider!

### SAML 2.0 (Azure AD SAML, ADFS)
- **IdP SSO URL**: te vinden in de SAML metadata van je identity provider
- **ACS URL** (instellen in IdP): `https://JOUW-NAAM.github.io/sciencelogic-app/`
- **SP Entity ID**: `https://JOUW-NAAM.github.io/sciencelogic-app/`

### API Token
Genereer een token in EM7:
**Mijn Profiel → API Tokens → Nieuw token aanmaken**

---

## 🛠 Local development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173/sciencelogic-app/`

---

## ⚠️ CORS

Als je een echte EM7-installatie gebruikt, you need to allow CORS on your EM7 server for your GitHub Pages domain. Do this in EM7 via:
**System → Settings → API → CORS Allowed Origins**

Add: `https://JOUW-NAAM.github.io`
