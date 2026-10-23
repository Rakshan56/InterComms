import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#1f2926", mint: "#9fd8c9", cream: "#f5f7f5", coral: "#f47782" }, fontFamily: { sans: ["Arial", "sans-serif"] } } }, plugins: [] } satisfies Config;
