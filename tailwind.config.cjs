// tailwind.config.js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          blue: '#00A3FF',
          yellow: '#FFD233',
          muted: '#64748B',
          border: '#E2E8F0',
          surface: '#F8FAFC',
        },
        dark: {
          bg: '#0B101B',
          card: '#151C2D',
          border: '#1E293B',
        }
      },
    },
  },
  plugins: [],
}
