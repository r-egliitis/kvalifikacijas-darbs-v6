// tailwind.config.js
// This file tells Tailwind CSS where to find our Vue components (for tree-shaking)
// and wires our CSS custom properties into the Tailwind color system.
// This lets us use classes like bg-primary, text-accent, etc. throughout the app.

/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode by toggling the 'dark' class on the <html> element
  darkMode: 'class',

  // Content: where Tailwind should scan for class names to include in the final CSS build
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],

  theme: {
    extend: {
      // Wire CSS custom properties as Tailwind color tokens.
      // These reference the variables defined in assets/css/main.css.
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
      colors: {
        primary:    'var(--color-primary)',
        secondary:  'var(--color-secondary)',
        accent:     'var(--color-accent)',
        background: 'var(--color-background)',
        surface:    'var(--color-surface)',
        'app-text': 'var(--color-text)',
      },
    },
  },

  plugins: [],
}
