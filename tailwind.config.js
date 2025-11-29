module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
        display: ["Fredoka", "sans-serif"],
      },

      colors: {
        paw: {
          primary: "#f97316", // Orange-500
          primaryDark: "#ea580c", // Orange-600
          secondary: "#2dd4bf", // Teal-400 (Fresh contrast)
          accent: "#fbbf24", // Amber-400
          pink: "#f472b6", // Pink-400
          soft: "#fff7ed", // Orange-50
          text: "#475569", // Slate-600
          dark: "#1e293b", // Slate-800
        },
      },
      animation: {
        wiggle: "wiggle 3s ease-in-out infinite",
        "wiggle-fast": "wiggle 0.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "bounce-slow": "bounce 3s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
};
