import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { citizenSessionStorage } from '@/lib/storage/citizenData'
import type { FormValues } from '@/lib/forms/types'

/**
 * Draft store — persisted, per-form draft saving for the Form Engine.
 * Complaint drafts, half-filled service applications, etc. survive reloads
 * within the browser session and are wiped on logout.
 */
export interface DraftState {
  drafts: Record<string, FormValues>
  saveDraft: (formId: string, values: FormValues) => void
  getDraft: (formId: string) => FormValues | undefined
  clearDraft: (formId: string) => void
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveDraft: (formId, values) => set((s) => ({ drafts: { ...s.drafts, [formId]: values } })),
      getDraft: (formId) => get().drafts[formId],
      clearDraft: (formId) =>
        set((s) => {
          const next = { ...s.drafts }
          delete next[formId]
          return { drafts: next }
        }),
    }),
    { name: 'vetri.drafts', version: 1, storage: citizenSessionStorage },
  ),
)
