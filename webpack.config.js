const path = require("path");

const isProduction = process.env.NODE_ENV === "production";


const config = {
    entry: "./src/frontend/main.tsx",
    output: {
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [

    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: [/node_modules/],
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [["@babel/env", { modules: false }], "@babel/react", "@babel/typescript"],
                        plugins: [
                            "@babel/proposal-numeric-separator",
                            "@babel/plugin-transform-runtime",
                            ["@babel/plugin-proposal-decorators", { legacy: true }],
                            "@babel/plugin-proposal-object-rest-spread",
                        ],
                    },
                },
            },
        ],
    },
    stats: {
        errorDetails: true,
    }
};

module.exports = () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
    }
    return config;
};
