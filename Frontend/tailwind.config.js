/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', mute: 'var(--mute)', line: 'var(--line)',
        acc: 'var(--acc)', pos: 'var(--pos)', neg: 'var(--neg)', neu: 'var(--neu)'
      },
      fontFamily: { display: ['Sora', 'system-ui', 'sans-serif'], body: ['"DM Sans"', 'system-ui', 'sans-serif'] }
    },
  },
  plugins: [],
}