# Personal Gemini Journal — Production Architecture

Security-first implementation for the Gen AI Academy APAC Ideathon.

## Architecture
Browser → Firebase Authentication → Firebase ID token → Cloud Run API → Google Secret Manager → Gemini API

Browser → Firebase Authentication → Cloud Firestore (owner-only rules)

## Requirements implemented in code
- Firebase/Google Authentication client
- Authenticated multi-turn Gemini endpoint
- Firestore persistence under `users/{uid}/journals`
- Server-side Gemini API key retrieval from Secret Manager
- Original **Insight Loop**: Gemini creates a structured summary, insights, and next actions
- Firestore owner-isolation rules
- Docker/Cloud Run deployment configuration
- Firebase Hosting configuration

## Required one-time cloud setup
1. Create a Firebase project and register a Web App.
2. Enable Firebase Authentication → Google provider.
3. Create Cloud Firestore in production mode.
4. Deploy `firestore.rules`.
5. Enable the required Gemini API/Google AI service for the project.
6. Create Secret Manager secret `GEMINI_API_KEY` containing the Gemini API key. Never put this value in GitHub or browser code.
7. Grant the Cloud Run runtime service account Secret Manager Secret Accessor access to that secret.
8. Set `GOOGLE_CLOUD_PROJECT` on the backend.
9. Populate the browser Firebase values from `.env.example` as environment variables during the frontend build.

## Local development
```bash
npm install
cp .env.example .env
npm run dev
```
Run the API separately with Google Application Default Credentials:
```bash
gcloud auth application-default login
npm run server
```

## Production
Build and deploy the SPA to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```
Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```
Build and deploy the API to Cloud Run:
```bash
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/journal/api
gcloud run deploy personal-gemini-journal-api --image REGION-docker.pkg.dev/PROJECT_ID/journal/api --region REGION --set-env-vars GOOGLE_CLOUD_PROJECT=PROJECT_ID
```
Then set `VITE_API_URL` to the Cloud Run HTTPS URL, rebuild the frontend, and redeploy Hosting.

Firebase Hosting provides CDN-backed HTTPS hosting for static/SPAs, while Cloud Run provides the trusted server boundary for Gemini and Secret Manager. Firebase App Hosting is another option for supported full-stack frameworks and GitHub-connected rollouts. See the official Firebase deployment docs linked below.

## Security
Firebase web configuration is not used as a Gemini secret. The Gemini credential is server-side only and retrieved from Secret Manager. The API verifies Firebase ID tokens before protected operations. Firestore rules require the authenticated UID to match the user path. `.env` and service-account files are ignored by Git.

Do not commit Gemini API keys, service-account JSON, or other secrets.

## Google AI Studio security constitution
```text
Act as a security-first production engineer. Threat-model every feature before coding. Never hardcode API keys, service-account credentials, tokens, or secrets. Keep Gemini credentials server-side and retrieve them from Google Cloud Secret Manager. Enforce Firebase Authentication on protected operations. Store user-owned Firestore records with an ownerId derived from verified auth context; never trust a client-supplied ownerId. Write Firestore Security Rules that prevent cross-user reads and writes. Validate and bound all user input. Apply least privilege to service accounts. Do not expose secrets to browser bundles or logs. Handle errors without leaking sensitive information. Prefer secure defaults, dependency hygiene, rate limiting, abuse controls, auditability, and explicit authorization checks. Explain security assumptions and failure modes before implementation.
```
