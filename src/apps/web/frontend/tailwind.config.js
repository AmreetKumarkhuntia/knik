/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    /* ---- Font size: the type scale is the only option (no Tailwind defaults) ---- */
    fontSize: {
      'display-2xl': [
        'var(--fs-display-2xl)',
        { lineHeight: 'var(--lh-tight)', letterSpacing: '-0.04em' },
      ],
      'display-xl': [
        'var(--fs-display-xl)',
        { lineHeight: 'var(--lh-tight)', letterSpacing: '-0.035em' },
      ],
      'display-lg': ['var(--fs-display-lg)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
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
        acc: {
          DEFAULT: 'var(--acc)',
          text: 'var(--acc-text)',
          soft: 'var(--acc-soft)',
          border: 'var(--acc-border)',
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
        /* density-aware tweak radii */
        btn: 'var(--r-btn, var(--radius-md))',
        card: 'var(--r-card, var(--radius-lg))',
      },

      /* ---- Font families from tokens ---- */
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
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
    },
  },
  plugins: [],
}
