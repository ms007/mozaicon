// Pull the app's Tailwind v4 cascade (tokens, `@custom-variant dark`) into
// the preview iframe so stories render against the same surfaces as prod.
import '../src/index.css'
// Bridges the Docs chrome (MDX page) onto the same tokens. See preview.css.
import './preview.css'

import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { addons } from 'storybook/preview-api'

const themes = { light: '', dark: 'dark' } as const

type GlobalsPayload = { globals?: { theme?: unknown } }

// `withThemeByClassName` owns the toolbar UI but only applies the theme
// class via a decorator — bypassed on docs-only MDX pages (Introduction,
// Foundations) that have no <Story>. Mirror the `theme` global off the
// preview channel so every page (story or docs) tracks the toolbar.
const applyTheme = ({ globals }: GlobalsPayload) => {
  const want = globals?.theme === themes.dark
  // `classList.toggle` always writes the attribute, which would re-fire
  // MutationObservers (the foundations swatches) on every globals update
  // — including ones unrelated to theme. Guard against the no-op write.
  const root = document.documentElement
  if (root.classList.contains(themes.dark) === want) return
  root.classList.toggle(themes.dark, want)
}

const channel = addons.getChannel()
channel.on(SET_GLOBALS, applyTheme)
channel.on(GLOBALS_UPDATED, applyTheme)

// The preview channel is a Vite-HMR-surviving singleton; without cleanup,
// each preview.ts re-evaluation would stack a duplicate listener pair.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    channel.off(SET_GLOBALS, applyTheme)
    channel.off(GLOBALS_UPDATED, applyTheme)
  })
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
  },
  decorators: [
    withThemeByClassName({
      themes,
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
}

export default preview
