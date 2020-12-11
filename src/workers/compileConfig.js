// @ts-check
/** @typedef {(rawTailwindConfig: string) => Promise<object>} CompileConfig */
/** @type {CompileConfig} */
export const compileConfig = async (rawTailwindConfig) => {
  const tailwindConfigWithAsyncImports = rawTailwindConfig.replace(
    /\brequire\(([^(]*)\)/g,
    (_, id) => `(await require(${id}))`
  );

  // eslint-disable-next-line no-eval
  const tailwindConfig = await eval(`(async () => {
    const require = async (id) => {
      function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
      const module = await import(\`https://cdn.skypack.dev/\${id}?min\`);
      return _interopDefault(module);
    }
    ${tailwindConfigWithAsyncImports}
  })()`);

  return tailwindConfig;
};
