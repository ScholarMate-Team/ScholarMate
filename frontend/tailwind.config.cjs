// tailwind.config.js
module.exports = {
    content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./src/assets/css/**/*.css"  // ✅ 이렇게!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
