import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sg: {
          red: 'var(--sg-red)',
          cardinal: 'var(--sg-cardinal)',
          deep: 'var(--sg-deep)',
          gray9: 'var(--sg-gray9)',
          gray11: 'var(--sg-gray11)',
          blue: 'var(--sg-blue)',
          teal: 'var(--sg-teal)',
          green: 'var(--sg-green)',
          orange: 'var(--sg-orange)',
          purple: 'var(--sg-purple)',
          ink: 'var(--sg-ink)',
          steel: 'var(--sg-steel)',
          line: 'var(--sg-line)',
          paper: 'var(--sg-paper)',
          mist: 'var(--sg-mist)',
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        brand: ['Pretendard Variable', 'Pretendard', 'serif'],
      },
      maxWidth: { site: '1320px' },
    },
  },
  plugins: [],
};
export default config;
