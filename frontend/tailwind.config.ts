import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
  		colors: {
        // ArUco measurement flow (nestup-*)
        nestup: {
          warm: '#F9FAFB',
          beige: '#FFF7ED',
          sand: '#E5E7EB',
          accent: '#F97316',
          'accent-dark': '#EA580C',
          charcoal: '#111827',
          'charcoal-light': '#6B7280',
          success: '#15803D',
          warning: '#A16207',
          error: '#B91C1C',
        },
        // DLS Color Palette
        'primary-blue': '#1A365D',
        'primary-orange': '#FF8A00',
        'accent-green': '#22543D',
        'technical-gray': '#4A5568',
        'neutral-dark': '#2D3748',
        'neutral-light': '#F7FAFC',
        'deep-wood-brown': '#8B4513',
        'modern-tech-blue': '#2563EB',
        'warm-gold': '#F59E0B',

        // Existing Colors
  			'lightest-bg': '#FFF8F0',
  			'lighter-bg': '#FFEBD1',
  			'light-bg': '#FFD9A6',
  			'lighter-interactive': '#FFB366',
  			'light-interactive': '#FF9F40',
  			'medium-interactive': '#FF8B1A',
  			'light-border': '#FF9F40',
  			'medium-border': '#FF8B1A',
  			'dark-border': '#F77600',
  			'theme-color': '#F6931E',
  			'dark-color': '#DD8502',
  			'darkest-color': '#C47600',
  			'darkest-text': '#BF5E00',
  			'very-dark-text': '#A85300',
  			'dark-text': '#8A4700',
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
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'card-foreground': '#0F172A',
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			'popover-foreground': 'var(--dark-text)',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-foreground': '#FFFFFF',
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			'secondary-foreground': '#8A4700',
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			'muted-foreground': '#64748B',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'accent-foreground': '#8A4700',
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			'destructive-foreground': '#FFFFFF',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
        nestup: '12px',
        'nestup-lg': '16px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
        // DLS Border Radius
        'dls-sm': '4px',
        'dls-md': '8px',
        'dls-lg': '12px',
  		},
      boxShadow: {
        nestup: '0 2px 8px rgba(0, 0, 0, 0.06)',
        'nestup-lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'nestup-hover': '0 6px 20px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        body: ['var(--font-source-sans-pro)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        'technical': ['14px', { lineHeight: '1.5' }],
        'spec': ['12px', { lineHeight: '1.4' }],
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
      }
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
