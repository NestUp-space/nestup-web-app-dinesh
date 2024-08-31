import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme
        'lightest-bg': '#FFF8F0',
        'lighter-bg': '#FFEBD1',
        'light-bg': '#FFD9A6',

        // Interactive Components
        'lighter-interactive': '#FFB366',
        'light-interactive': '#FF9F40',
        'medium-interactive': '#FF8B1A',

        // Borders and Separators
        'light-border': '#FF9F40',
        'medium-border': '#FF8B1A',
        'dark-border': '#F77600',

        // Solid Colours
        'theme-color': '#F6931E',
        'dark-color': '#DD8502',
        'darkest-color': '#C47600',

        // Accessible Text
        'darkest-text': '#BF5E00',
        'very-dark-text': '#A85300',
        'dark-text': '#8A4700',

        // Black and White variants
        'lightest-bw': '#F8F8F8',
        'lighter-bw': '#EBEBEB',
        'light-bw': '#D9D9D9',
        'lighter-interactive-bw': '#B3B3B3',
        'light-interactive-bw': '#9F9F9F',
        'medium-interactive-bw': '#8B8B8B',
        'dark-border-bw': '#767676',
        'dark-color-bw': '#858585',
        'darkest-color-bw': '#767676',
        'darkest-text-bw': '#5E5E5E',
        'very-dark-text-bw': '#535353',
        'dark-text-bw': '#474747',
        'theme-dark': '#3B3B3B',
      },
      // Add any additional customization under extend
    },
  },
  plugins: [],
};

export default config;
