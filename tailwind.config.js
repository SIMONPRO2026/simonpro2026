/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-blue-50','bg-green-50','bg-red-50','bg-amber-50','bg-purple-50','bg-teal-50',
    'bg-blue-500','bg-green-500','bg-red-500','bg-amber-500','bg-purple-500','bg-teal-500',
    'text-blue-700','text-green-700','text-red-700','text-amber-700','text-purple-700','text-teal-700',
    'bg-blue-100','bg-green-100','bg-red-100','bg-amber-100','bg-purple-100',
    'animate-pulse', 'line-clamp-1', 'line-clamp-2',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8eef7',
          100: '#c5d3ea',
          500: '#162d56',
          600: '#0f2140',
          700: '#0a1830',
          900: '#060e1e',
        },
        primary: {
          50: '#dbeafe',
          500: '#1d6fde',
          600: '#1558b8',
          700: '#1044a0',
        },
      },
    },
  },
  plugins: [],
}
