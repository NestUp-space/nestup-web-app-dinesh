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

        // Shadcn UI specific theme colors
        'background': '#FFFFFF', // Assuming white background for light theme
        'foreground': '#0F172A', // Dark text for readability on light background (e.g., slate-900)
        'card': '#FFFFFF',
        'card-foreground': '#0F172A',
        'popover': '#FFFFFF',
        'popover-foreground': 'var(--dark-text)', // Use a CSS variable for dark-text
        'primary': '#F6931E', // Your theme color
        'primary-foreground': '#FFFFFF', // Text on primary color
        'secondary': '#FFEBD1', // Lighter background as secondary
        'secondary-foreground': '#8A4700', // Dark text for secondary
        'muted': '#F1F5F9', // e.g., slate-200
        'muted-foreground': '#64748B', // e.g., slate-500
        'accent': '#FFF8F0', // Lightest background as accent
        'accent-foreground': '#8A4700', // Dark text for accent
        'destructive': '#EF4444', // e.g., red-500
        'destructive-foreground': '#FFFFFF',
        'border': '#FFD9A6', // Light background as border
        'input': '#FFD9A6', // Light background for input borders
        'ring': '#F6931E', // Theme color for focus rings
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      // Add any additional customization under extend
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
