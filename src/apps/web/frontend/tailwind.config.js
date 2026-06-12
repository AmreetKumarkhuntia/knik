/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ---- Colors mapped from CSS tokens ---- */
      colors: {
        aurora: {
          50: 'var(--aurora-50)',
          100: 'var(--aurora-100)',
          200: 'var(--aurora-200)',
          300: 'var(--aurora-300)',
          400: 'var(--aurora-400)',
          500: 'var(--aurora-500)',
          600: 'var(--aurora-600)',
          700: 'var(--aurora-700)',
          800: 'var(--aurora-800)',
          900: 'var(--aurora-900)',
        },
        teal: {
          300: 'var(--teal-300)',
          400: 'var(--teal-400)',
          500: 'var(--teal-500)',
          600: 'var(--teal-600)',
          700: 'var(--teal-700)',
        },
        violet: {
          400: 'var(--violet-400)',
          500: 'var(--violet-500)',
          600: 'var(--violet-600)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },
        fg: {
          1: 'var(--fg-1)',
          2: 'var(--fg-2)',
          3: 'var(--fg-3)',
          4: 'var(--fg-4)',
          5: 'var(--fg-5)',
          inverse: 'var(--fg-inverse)',
        },
      },

      /* ---- Spacing from token scale ---- */
      spacing: {
        'knik-1': 'var(--space-1)',
        'knik-2': 'var(--space-2)',
        'knik-3': 'var(--space-3)',
        'knik-4': 'var(--space-4)',
        'knik-5': 'var(--space-5)',
        'knik-6': 'var(--space-6)',
        'knik-8': 'var(--space-8)',
        'knik-10': 'var(--space-10)',
        'knik-12': 'var(--space-12)',
        'knik-16': 'var(--space-16)',
        'knik-20': 'var(--space-20)',
      },

      /* ---- Border radius from tokens ---- */
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },

      /* ---- Font families from tokens ---- */
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },

      /* ---- Font size from type scale ---- */
      fontSize: {
        'display-2xl': ['var(--fs-display-2xl)', { lineHeight: 'var(--lh-tight)' }],
        'display-xl': ['var(--fs-display-xl)', { lineHeight: 'var(--lh-tight)' }],
        'display-lg': ['var(--fs-display-lg)', { lineHeight: 'var(--lh-tight)' }],
        h1: ['var(--fs-h1)', { lineHeight: 'var(--lh-snug)' }],
        h2: ['var(--fs-h2)', { lineHeight: 'var(--lh-snug)' }],
        h3: ['var(--fs-h3)', { lineHeight: '1.3' }],
        h4: ['var(--fs-h4)', { lineHeight: '1.35' }],
        'body-lg': ['var(--fs-body-lg)', { lineHeight: 'var(--lh-relaxed)' }],
        body: ['var(--fs-body)', { lineHeight: 'var(--lh-base)' }],
        'body-sm': ['var(--fs-body-sm)', { lineHeight: 'var(--lh-base)' }],
        caption: ['var(--fs-caption)', { lineHeight: 'var(--lh-base)' }],
        micro: ['var(--fs-micro)', { lineHeight: 'var(--lh-base)' }],
      },

      /* ---- Letter spacing from tracking tokens ---- */
      letterSpacing: {
        tightest: 'var(--tracking-tightest)',
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        mono: 'var(--tracking-mono)',
      },

      /* ---- Box shadows from tokens ---- */
      boxShadow: {
        'knik-1': 'var(--shadow-1)',
        'knik-2': 'var(--shadow-2)',
        'knik-3': 'var(--shadow-3)',
        glow: 'var(--glow-primary)',
        'glow-teal': 'var(--glow-teal)',
      },

      /* ---- Transition timing from motion tokens ---- */
      transitionTimingFunction: {
        'knik-out': 'var(--ease-out)',
        'knik-in-out': 'var(--ease-in-out)',
        'knik-spring': 'var(--ease-spring)',
      },

      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
        slower: 'var(--dur-slower)',
      },

      /* ---- Backdrop blur ---- */
      backdropBlur: {
        glass: '20px',
      },

      /* ---- Animations ---- */
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        bounce: 'bounce 1s infinite',
        blob: 'knik-blob 10s var(--ease-in-out) infinite',
        'fade-in': 'knik-page-enter var(--dur-base) var(--ease-out)',
        'edge-dash': 'knik-dash 1s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backgroundSize: {
        200: '200% 200%',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-2000': { 'animation-delay': '2s' },
        '.animation-delay-4000': { 'animation-delay': '4s' },
      })
    },
  ],
}
