module.exports = {
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    trailingComma: "es5",
    printWidth: 80,
    arrowParens: "always",
    endOfLine: "auto",
    bracketSpacing: true,

    // Override settings for specific file types
    overrides: [
        {
            files: ["components/ui/**/*.tsx", "components/ui/**/*.ts"],
            options: {
                requirePragma: true, // Only format files with @format pragma
            },
        },
    ],
};
