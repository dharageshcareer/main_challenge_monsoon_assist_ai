/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#005c55',
          container: '#0f766e',
          fixed: '#9cf2e8',
          'fixed-dim': '#80d5cb',
        },
        secondary: {
          DEFAULT: '#545f73',
          container: '#d5e0f8',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        background: '#f7f9fb',
        surface: {
          DEFAULT: '#f7f9fb',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          'container-lowest': '#ffffff',
          'container-low': '#f2f4f6',
          'container': '#eceef0',
          'container-high': '#e6e8ea',
          'container-highest': '#e0e3e5',
        },
        outline: '#6e7977',
        'outline-variant': '#bdc9c6',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      spacing: {
        gutter: '16px',
        'container-padding': '24px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
      },
    },
  },
  plugins: [],
}
