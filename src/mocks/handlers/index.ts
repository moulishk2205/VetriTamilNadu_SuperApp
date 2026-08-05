import type { RequestHandler } from 'msw'
import { authHandlers } from './auth'
import { documentHandlers } from './documents'
import { notificationHandlers } from './notifications'
import { catalogHandlers } from './catalog'
import { citizenHandlers } from './citizen'
import { complaintHandlers } from './complaints'
import { applicationHandlers } from './applications'
import { officerHandlers } from './officer'
import { analyticsHandlers } from './analytics'
import { searchHandlers } from './search'
import { aiHandlers } from './ai'

/**
 * Aggregated MSW request handlers, one array per domain. Each mirrors the
 * production API contract exactly, so swapping to a real backend is a base-URL
 * change (see config/env.ts) — no component or API-layer code changes.
 */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...documentHandlers,
  ...notificationHandlers,
  ...catalogHandlers,
  ...citizenHandlers,
  ...complaintHandlers,
  ...applicationHandlers,
  ...officerHandlers,
  ...analyticsHandlers,
  ...searchHandlers,
  ...aiHandlers,
]
