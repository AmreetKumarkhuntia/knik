/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    /* ---- Font size: the type scale is the only option (no Tailwind defaults) ---- */
    fontSize: {
      h1: ['var(--fs-h1)', { lineHeight: '2rem', letterSpacing: '-0.019em', fontWeight: '600' }],
      h2: ['var(--fs-h2)', { lineHeight: '1.75rem', letterSpacing: '-0.017em', fontWeight: '600' }],
      h3: ['var(--fs-h3)', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '600' }],
      h4: ['var(--fs-h4)', { lineHeight: '1.25rem', letterSpacing: '-0.006em', fontWeight: '600' }],
      'body-lg': ['var(--fs-body-lg)', { lineHeight: '1.625rem', letterSpacing: '-0.011em' }],
      body: ['var(--fs-body)', { lineHeight: '1.25rem', letterSpacing: '-0.006em' }],
      'body-sm': ['var(--fs-body-sm)', { lineHeight: '1.25rem', letterSpacing: '-0.003em' }],
      label: [
        'var(--fs-label)',
        { lineHeight: '1.125rem', letterSpacing: '-0.003em', fontWeight: '500' },
      ],
      caption: ['var(--fs-caption)', { lineHeight: '1rem', letterSpacing: '0.005em' }],
      micro: [
        'var(--fs-micro)',
        { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '500' },
      ],
      mono: ['var(--fs-mono)', { lineHeight: '1.25rem', letterSpacing: '0' }],
      'mono-sm': ['var(--fs-mono-sm)', { lineHeight: '1rem', letterSpacing: '0' }],
    },

    extend: {
      /* ---- Colors mapped from CSS tokens ---- */
      colors: {
        border: {
          DEFAULT: 'var(--border-2)',
          1: 'var(--border-1)',
          2: 'var(--border-2)',
          3: 'var(--border-3)',
        },
        aurora: {
          300: 'var(--aurora-300)',
          400: 'var(--aurora-400)',
        },
        teal: {
          300: 'var(--teal-300)',
        },
        violet: {
          400: 'var(--violet-400)',
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
        },
      },

      /* ---- Border radius from tokens ---- */
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },

      /* ---- Font families from tokens ---- */
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },

      /* ---- Letter spacing from tracking tokens ---- */
      letterSpacing: {
        tight: 'var(--tracking-tight)',
        wide: 'var(--tracking-wide)',
      },

      /* ---- Box shadows from tokens ---- */
      boxShadow: {
        'knik-2': 'var(--shadow-2)',
        'knik-3': 'var(--shadow-3)',
      },

      /* ---- Transition timing from motion tokens ---- */
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
      },
    },
  },
  plugins: [],
}
