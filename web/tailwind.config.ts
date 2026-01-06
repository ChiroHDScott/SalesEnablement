import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                chirohd: "#FF3B00", // Approximate brand color
                sked: "#0099FF",
                spark: "#FF9900",
            },
        },
    },
    plugins: [],
};
export default config;
