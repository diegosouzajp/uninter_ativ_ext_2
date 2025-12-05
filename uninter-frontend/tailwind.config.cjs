/** @type {import('tailwindcss').Config} */
module.exports = {
  // This array is CRITICAL. It tells Tailwind to scan all JS/JSX files
  // in your src folder for class names.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // You can extend the default theme here if you need custom colors/fonts
      // For example, extending the color palette:
      // colors: {
      //   brand: '#123456',
      // }
    },
  },
  plugins: [],
}
