import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Legacy clinical tokens (landing page) ──
        ink: '#1b1b1b',
        marble: '#ffffff',
        'drafting-gray': '#eaeaea',
        steel: '#60646c',
        ash: '#7c7c7c',
        hairline: '#e0e1e6',
        'mint-signal': '#00f2e6',
        moss: '#8dc63f',
        sky: '#00b9f1',

        // ── Dashboard sidebar ──
        sidebar: {
          bg: '#0E1130',
          active: '#5B4FE9',
          text: '#9CA3C4',
          'text-active': '#FFFFFF',
          border: '#1A1F45',
        },

        // ── Brand accent ──
        accent: {
          DEFAULT: '#6C5CE7',
          hover: '#5A4BD4',
          light: '#EDE9FE',
        },

        // ── App surfaces ──
        app: {
          bg: '#F5F6FA',
          card: '#FFFFFF',
          border: '#EDEEF3',
        },

        // ── Text ──
        primary: '#1A1D2E',
        secondary: '#8B8FA3',

        // ── Semantic status colors ──
        success: '#22C55E',
        warning: '#F5A623',
        info: '#3B82F6',
        danger: '#EF4444',

        // ── Icon chip backgrounds ──
        chip: {
          purple: '#EDE9FE',
          'purple-text': '#7C3AED',
          blue: '#DBEAFE',
          'blue-text': '#2563EB',
          green: '#D1FAE5',
          'green-text': '#059669',
          orange: '#FEF3C7',
          'orange-text': '#D97706',
          pink: '#FCE7F3',
          'pink-text': '#DB2777',
          cyan: '#CFFAFE',
          'cyan-text': '#0891B2',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        display: ['90px', { lineHeight: '1' }],
        heading: ['40px', { lineHeight: '1.1' }],
        kpi: ['30px', { lineHeight: '1.1' }],
      },

      letterSpacing: {
        display: '-4.5px',
        heading: '-1px',
        wider: '0.06em',
        widest: '0.08em',
      },

      borderRadius: {
        button: '6px',
        panel: '12px',
        card: '20px',
        pill: '40px',
      },

      boxShadow: {
        lg: 'rgba(0,0,0,0.15) 0px 4px 20px 0px',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
