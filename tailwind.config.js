/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFC107",
        "accent-pink": "#FF6B6B",
        "accent-blue": "#4DABF7",
        "accent-green": "#51CF66",
        "accent-purple": "#BE4BDB",
        "background-vibrant": "#FFD43B",
        "background-light": "#F9FAFB",
        "background-dark": "#121212",
        "card-dark": "#1E1E1E",
        "accent-black": "#1A1A1A",
      },
      borderRadius: {
        DEFAULT: "1.5rem",
        "large": "2rem",
        "2xl": "1.5rem",
        "3xl": "2.5rem",
        "4xl": "3rem",
      },
      boxShadow: {
        "3d-black": "0 6px 0 0 #000000",
        "3d-yellow": "0 4px 0 0 #D9A406",
        "3d-pink": "0 8px 0 0 #E03131",
        "3d-pink-sm": "0 4px 0 0 #E03131",
        "3d-blue": "0 6px 0 0 #1971C2",
        "3d-purple": "0 6px 0 0 #862E9C",
        "3d-green": "0 6px 0 0 #2F9E44",
        "card": "0 20px 50px rgba(0,0,0,0.1)",
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        display: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
