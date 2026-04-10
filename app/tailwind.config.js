/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cream:     '#fbf5f0',
          teal:      '#318086',
          tealLight: '#6ac4b7',
          tealPale:  '#b3dad7',
          amber:     '#ffb04f',
          amberPale: '#ffd38d',
          pink:      '#ffb8ad',
          pinkPale:  '#ffb8ad',
          charcoal:  '#3a3a3a',
          brown:     '#4c3a2e',
        },
      },
      fontFamily: {
        sans:   ['Apercu', 'Trebuchet MS', 'system-ui', 'sans-serif'],
        serif:  ['Bodoni16', 'Georgia', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'cream': "url('/bg-texture.svg')",
      },
    },
  },
  plugins: [],
}
