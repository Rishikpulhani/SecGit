/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        github: {
          bg: '#0d1117',
          'bg-secondary': '#161b22',
          'bg-tertiary': '#21262d',
          text: '#f0f6fc',
          'text-secondary': '#8b949e',
          'text-muted': '#6e7681',
          border: '#30363d',
          'border-muted': '#21262d',
          accent: '#2f81f7',
          'accent-emphasis': '#1f6feb',
          success: '#238636',
          danger: '#da3633',
          warning: '#f85149',
        },
        primary: {
          50: '#f6f8fa',
          100: '#eaeef2',
          500: '#0969da',
          600: '#0550ae',
          700: '#033d8b',
          900: '#0a3069',
        },
        secondary: {
          50: '#f6f8fa',
          100: '#eaeef2',
          500: '#656d76',
          600: '#424a53',
          700: '#32383f',
          900: '#24292f',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
