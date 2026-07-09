import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    js.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                React: "readonly",  // ← 添加这一行
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "react": react,
            "react-hooks": reactHooks,
        },
        rules: {
            "no-console": "warn",
            "no-unused-vars": "off",
            "no-undef": "off",  // ← 关闭 no-undef，用 TypeScript 的检查替代
            "@typescript-eslint/no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            "@typescript-eslint/no-explicit-any": "warn",
            "react/react-in-jsx-scope": "off",  // ← React 17+ 不需要导入 React
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        ignores: [
            "node_modules/",
            "dist/",
            "build/",
            "*.config.js",
            "*.config.ts",
            "vite.config.ts"
        ],
    },
];
