import babel from "rollup-plugin-babel";
const moduleFormat = "umd";

export default [
  {
    input: "src/leaflet-geotiff.js",
    output: [
      {
        dir: "dist",
        format: moduleFormat,
        globals: {
          "@babel/runtime/regenerator": "regeneratorRuntime",
        },
      },
    ],
    plugins: [babel({ exclude: "node_modules/**" })],
  },
  {
    input: "src/leaflet-geotiff-plotty.js",
    output: [
      {
        dir: "dist",
        format: moduleFormat,
      },
    ],
    plugins: [
      babel({
        exclude: "node_modules/**",
        runtimeHelpers: true,
        presets: ["@babel/preset-env"],
        plugins: [
          "@babel/plugin-transform-async-to-generator",
          "@babel/plugin-transform-regenerator",
          [
            "@babel/plugin-transform-runtime",
            {
              helpers: true,
              regenerator: true,
            },
          ],
        ],
      }),
    ],
    external: ["geotiff/dist-browser/geotiff", "plotty"],
  },
  {
    input: "src/leaflet-geotiff-rgb.js",
    output: [
      {
        dir: "dist",
        format: moduleFormat,
      },
    ],
    plugins: [babel({ exclude: "node_modules/**" })],
  },
  {
    input: "src/leaflet-geotiff-vector-arrows.js",
    output: [
      {
        dir: "dist",
        format: moduleFormat,
      },
    ],
    plugins: [babel({ exclude: "node_modules/**" })],
  },
];
