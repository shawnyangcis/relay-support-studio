# Relay Support Studio

[Live demo](https://relay-support-studio.vercel.app) · [Website embed preview](https://relay-support-studio.vercel.app/website)

A small, working website support assistant: source-backed answers, contextual follow-ups, and downloadable handoff drafts. Relay is a fictional collaboration product. All product policies and prices are sample content.

## What to try

1. Ask **How much is the Pro plan?**, then **What about annual billing?** Open the citation to inspect the supporting quote and article.
2. Ask **I can't log in**, then **I use Google**. The assistant should clarify the sign-in method and suggest the relevant steps.
3. Ask **Can you guarantee EU-only data storage?** The available documentation cannot confirm this. Preview the handoff draft, including the question, confirmed facts, suggested/completed steps, unresolved issue, and transcript.
4. Visit `/website` and open the floating widget. This uses the same backend and the `/embed` page.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
# Configure AI_GATEWAY_API_KEY in .env.local using your secret manager.
npm run dev
```

Without local model credentials, the UI, articles, and website embed still work; chat returns a clear configuration error. Responses are never silently replaced with scripts.

## Architecture

```text
Chat UI / embedded iframe
  → POST /api/chat (validated and bounded conversation)
  → Context-aware keyword retrieval over 8 sample articles
  → Vercel AI Gateway → live language model
  → Structured answer, exact supporting quotations, follow-ups, optional handoff
  → Citation validation → response and original source viewer
```

- **Next.js / React / TypeScript** for the website, embed, and server route.
- **AI SDK 7** structured generation. Default model: `anthropic/claude-haiku-5.5`, verified against the Gateway catalog at implementation time. Override with `AI_GATEWAY_MODEL`.
- **Small-corpus retrieval** in `lib/knowledge.ts`. This is keyword retrieval with recent user-message context, not a vector database or a claim of semantic-search coverage.
- **Grounding validation** rejects unknown source IDs, sources not retrieved, and non-verbatim quotations. An answered response without a valid citation becomes a handoff. Exact quotes help inspection but do not mathematically prove every generated claim; realistic evaluation remains necessary.
- **Privacy**: browser memory only for chat history; no app database or analytics. Messages are sent to the model provider, whose processing and logging policies apply. Only sample questions should be used. Application error logs exclude prompts, secrets, and upstream response bodies.

## Deploy on Vercel

Import this repository as a Next.js project. Use Node.js 24. Vercel project OIDC authenticates AI Gateway automatically; the team needs an active Gateway credit balance and access to the selected model. Optional `AI_GATEWAY_MODEL` selects another compatible model. No provider key belongs in the browser.

The project should have an AI Gateway **project-scoped spend cap**. The application also bounds request size, conversation history, model output, timeout, retries, and includes a 12-request/minute **instance-local** throttle. This is a demo-level throttle, not a globally consistent abuse-control service. A client production launch needs distributed rate limiting, bot protection, observability, an evaluation set, and an approved support destination.

## Embed on another website

Replace the origin with the deployed URL:

```html
<script src="https://YOUR-DEPLOYMENT.vercel.app/embed.js" defer></script>
```

The loader creates an isolated Shadow DOM launcher and a lazily loaded iframe. Chat API requests originate inside that iframe; the host site does not receive model credentials. The widget is responsive and has an accessible open/close control. The host site's Content Security Policy must allow the script and frame origin. A production integration should restrict approved embedding domains; this public demonstration intentionally allows embedding.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The focused tests cover retrieval with follow-up context, missing knowledge, input constraints, quotation validation, and truthful handoff exports. Live model output must also be evaluated on the deployed site because it is nondeterministic.

## Deliberate boundaries

- No real account access, subscription changes, refunds, or ticket creation.
- Handoff drafts are previewed/downloaded only, never sent to a team.
- No invented support agents, response-time guarantees, certifications, or business outcomes.
- The deployed prototype uses TypeScript; a Java requirement for a client backend should be confirmed separately.

Built by Shawn as a focused demonstration of a complete support journey.
