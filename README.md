# Personal Gemini Journal — Gen AI Academy APAC Ideathon

A security-first prototype for the **Personal Gemini Journal** challenge.

## Prototype features
- Premium responsive journal UI
- Multi-turn conversation interface
- Reflection capture and local prototype persistence
- Security architecture panel covering authentication, Firestore isolation and Secret Manager
- Original enhancement: **Insight Loop** concept to turn reflections into next actions

## Production architecture
- Frontend: React + Vite
- Identity: Firebase Authentication
- Data: Cloud Firestore with owner-scoped security rules
- AI: Gemini API called only from a trusted server environment
- Secrets: Google Cloud Secret Manager

> Important: this repository currently contains the submission-ready UI prototype. Firebase/Gemini credentials are intentionally not embedded. Before claiming the full production requirements are complete, configure the Firebase project, Firestore rules, server-side Gemini integration, Secret Manager secret, and deployment environment.

## Security constitution for Google AI Studio
```text
Act as a security-first production engineer. Threat-model every feature before coding. Never hardcode API keys, service-account credentials, tokens, or secrets. Keep Gemini credentials server-side and retrieve them from Google Cloud Secret Manager. Enforce Firebase Authentication on protected operations. Store user-owned Firestore records with an ownerId derived from the verified auth context; never trust a client-supplied ownerId. Write Firestore Security Rules that prevent cross-user reads and writes. Validate and bound all user input. Apply least privilege to service accounts. Do not expose secrets to browser bundles or logs. Handle errors without leaking sensitive information. Prefer secure defaults, dependency hygiene, rate limiting, abuse controls, auditability, and explicit authorization checks. Explain security assumptions and failure modes before implementation.
```

## Firestore rule target
Each user document should be scoped by authenticated UID, e.g. `/users/{uid}/journals/{journalId}`, with reads/writes allowed only when `request.auth.uid == uid`.

## Submission links
Repository: https://github.com/kvindu18/Software-developer
