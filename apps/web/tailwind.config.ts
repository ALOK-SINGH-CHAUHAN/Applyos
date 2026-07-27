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
        ink: '#1b1b1b',
        marble: '#ffffff',
        'drafting-gray': '#eaeaea',
        steel: '#60646c',
        ash: '#7c7c7c',
        hairline: '#e0e1e6',
        success: '#19a05f',
        progress: '#00b9f1',
        warning: '#f5a623',
        error: '#d64545',
        confidence: '#00f2e6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['90px', '1'],
        heading: ['40px', '1.1'],
      },
      letterSpacing: {
        display: '-4.5px',
        heading: '-1px',
      },
      borderRadius: {
        button: '6px',
        panel: '12px',
        card: '20px',
        pill: '40px',
      },
      boxShadow: {
        lg: 'rgba(0,0,0,0.15) 0px 4px 20px 0px',
      },
    },
  },
  plugins: [],
};

export default config;
