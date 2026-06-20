/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'product-light': "url('/fondo-producto-claro.png')",
        'product-dark':  "url('/fondo-producto-oscurio-grande.png')",
      },
      colors: {
        // ── Paleta Oficial WOT Energy S.A.S. ──────────────
        'brand': {
          50:  '#e6f8f6',
          100: '#b3ece6',
          200: '#80e0d7',
          300: '#4dd4c7',
          400: '#26c0af',
          500: '#19B5A5',   // Aquamarine — oficial
          600: '#149e90',
          700: '#0f877b',
          800: '#0a7066',
          900: '#055950',
        },
        'wot': {
          // Colores oficiales de la marca
          aquamarine: '#19B5A5',
          green:      '#6EDB6E',
          yellow:     '#F4C430',
          black:      '#000000',
          white:      '#FFFFFF',
          // Fondos dark mode (basados en negro oficial)
          dark:       '#080D14',   // Fondo principal dark
          'dark-2':   '#0D1A2A',   // Cards
          'dark-3':   '#122236',   // Bordes/paneles
          'dark-4':   '#1A3050',   // Hover sutil
          muted:      '#7A9BBF',   // Texto secundario
          border:     '#1C3454',   // Bordes dark
        },
        // Aliases de compatibilidad
        'wot-yellow': '#F4C430',
        'wot-green':  '#6EDB6E',
        'natec-yellow': '#F4C430',
      },
      fontFamily: {
        // Tipografía oficial WOT: Montserrat primero, Poppins como fallback
        sans: ['Montserrat', 'Poppins', 'system-ui', 'sans-serif'],
        body: ['Poppins',    'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.8s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'bounce-in':    'bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shimmer':      'shimmer 1.5s infinite',
        'shake':        'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'glow-pulse':   'glowPulse 2.5s ease-in-out infinite',
        'card-enter':   'cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'float':        'float 3.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%':      { transform: 'translateX(-50%) translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '10%, 90%':       { transform: 'translateX(-2px)' },
          '20%, 80%':       { transform: 'translateX(4px)' },
          '30%, 50%, 70%':  { transform: 'translateX(-6px)' },
          '40%, 60%':       { transform: 'translateX(6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px 0 rgba(25, 181, 165, 0.35)' },
          '50%':      { boxShadow: '0 0 24px 6px rgba(25, 181, 165, 0.6)' },
        },
        cardEnter: {
          '0%':   { opacity: '0', transform: 'scale(0.97) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'card':       '0 2px 12px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px 0 rgba(0,0,0,0.14)',
        'wot-glow':   '0 0 22px 4px rgba(25, 181, 165, 0.28)',
        'wot-card':   '0 4px 28px 0 rgba(8, 13, 20, 0.7)',
        'wot-yellow': '0 0 16px 2px rgba(244, 196, 48, 0.35)',
      },
    },
  },
  plugins: [],
};
