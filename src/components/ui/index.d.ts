import type { ComponentType } from 'react'

/**
 * Loose type surface for the shared UI primitives (implemented in index.jsx).
 * They are prop-flexible design primitives; typing them as open components lets
 * strict `.tsx` consumers use them without re-declaring every prop, while the
 * `.jsx` screens continue to consume them untyped.
 */
type UIComponent = ComponentType<Record<string, unknown>>

export const Seal: UIComponent
export const StatusBar: UIComponent
export const BottomNav: UIComponent
export const Btn: UIComponent
export const Card: UIComponent
export const Sec: UIComponent
export const Empty: UIComponent
export const BackBtn: UIComponent
export const Header: UIComponent
export const Toggle: UIComponent
export const SearchModal: UIComponent
