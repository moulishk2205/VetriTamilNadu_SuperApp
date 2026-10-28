# Vetri TN — Phase 4: Ask Vetri, the AI Operating System

Ask Vetri is no longer an intent-list chatbot. It is an orchestration pipeline
that **reasons over live platform state** and **operates the application**:

```
text → Intent Engine → Citizen Context → Planning Engine
     → Tool Orchestrator → Response Composer → reply + action cards
                                 ↑
              Government Knowledge Graph + Life Event Engine + Memory
```

**Honesty note:** this build runs fully offline with no live LLM, so the
pipeline is deterministic reasoning — intent extraction, graph expansion,
planning, and tool execution over real state — with an explicit LLM seam at the
composer (`responseComposer.ts` generates the surface from structured inputs; a
model later does the same job better without touching intent/context/plan/tool
layers). Nothing is canned: every sentence is assembled from tool outputs, the
old regex-reply list in the mock handler was deleted.

## Architecture (`src/features/ai/`)

| Module | Role |
|---|---|
| `knowledge/lifeEvents.ts` | Life Event Engine — 9 events (bereavement, marriage, property, migration, birth, vehicle, education, retirement, farming) with triggers (ta/en), **dependency-ordered service sequences**, benefits, future recommendations |
| `knowledge/serviceGraph.ts` | Government Knowledge Graph — nodes **derived** from `SERVICE_META`+`FORMS` (zero duplication) + curated officer-grade tips / common mistakes / rejection reasons + keyword index + cross-service edges |
| `engine/intentEngine.ts` | Deterministic NLP: intent kind, **multi-intent** life events + services, entities (ref numbers, districts, nav targets), urgency, sentiment, language (ta/en/mixed), memory-ranked |
| `engine/contextBuilder.ts` | Citizen Context — pure function over injected live state: age, wallet **with expiry analysis**, applications, corrections, schemes |
| `engine/planner.ts` | Planning Engine — never answers directly; builds typed tool plans with per-step rationale |
| `engine/toolExecutor.ts` | Tool Orchestrator — typed registry (`wallet.list/coverage`, `applications.*`, `service.meta`, `schemes.match`, `timeline.predict`, `navigate.build`); includes **document coverage matching** (wallet ↔ service checklist) and **future-need prediction** |
| `engine/responseComposer.ts` | Bilingual surface from tool outputs + graph knowledge; empathy/celebration tone from the event; action cards (apply/track/wallet/pay/view) |
| `engine/orchestrator.ts` | `runAskVetri()` + `computeProactive()` (predictive Ask Vetri) |
| `memory/citizenMemory.ts` | Persistent personalisation — frequent services (recorded on card taps) rank ambiguous intents; last intents |

`mocks/handlers/ai.ts` is now a **thin delegate** that assembles live state
(citizen, wallet, applications, schemes, notifications) and calls the
orchestrator — exactly what a NestJS controller will do.

## Verified live (computed, not scripted)

| Scenario | Result |
|---|---|
| **"I moved to Chennai after marriage and bought a house"** | intent `lifeEvent:marriage+propertyPurchase+migration` — 3 events from one sentence; 7-step merged plan sequenced by dependency (Marriage → Ration w/ NFSA spouse-dedup note → Residence → EC "search back to 1987" → Chitta → Patta "after the registered deed" → Property Tax), Tamil headline names all three events, visible reasoning trace, 3 action cards |
| "My father passed away" | Empathy prefix, Death Cert **before** Legal Heir (dependency), omission-is-an-offence warning |
| "I need an income certificate" | **Duplicate detection** — cites live `APP-2026-IC-44821` in progress, suggests Track instead; flags the wallet's expired IC |
| "What documents am I missing for legal heir" | Computed coverage: "covers X of Y required" + concrete missing list from `FORMS` vs wallet |
| "What documents do I have" | Live wallet inventory + expiry flags (`IC-TN-2024-9912 (03/2025)` expired) |
| Proactive suggestions | 4 predictions from state: expired cert (real number), age-based next-need, **date-aware property-tax window ("opens October 1" — computed in July)**, scheme count |
| Memory | `vetri.ai.memory` persists; service card taps recorded; intent ranking personalised |
| Voice | Interruption added — recognition start and every new send cancels TTS; no overlapping utterances |

## UI

Unchanged design language. Additive only: the existing AI bubble now shows a
small muted **reasoning-trace block** (✓ per executed plan step) above the
reply, and suggestion chips/action cards render exactly as before.

## Quality gates

`tsc` 0 errors · `eslint` 0 errors (1 pre-existing prototype warning) · build
green (77 chunks) · **zero console errors** through all scenarios · officer
portal, 21-service catalog, demo mode regression-checked · dark mode/Tamil
untouched (all surfaces token-driven).

## LLM swap path (Phase-next)

Replace `responseComposer.compose()` with a model call whose prompt is the
`IntentFrame + CitizenContext + Plan + ToolResults` JSON — the tool registry
becomes function-calling definitions 1:1. Everything else ships as-is.
