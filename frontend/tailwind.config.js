/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        card: '#0F172A',       // slate-900
        cardHover: '#1E293B',  // slate-800
        primary: '#22C55E',    // green-500
        textPrimary: '#F8FAFC',// slate-50
        textMuted: '#94A3B8',  // slate-400
        accent: '#3B82F6',     // blue-500
        danger: '#EF4444'      // red-500
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Fira Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
