module.exports = {
  content: ['./*.html', './**/*.html'], // Scan all HTML files in root and subdirectories
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Custom primary color
        secondary: '#4b5563', // Custom secondary color
      },
    },
  },
  plugins: [],
}
