// @ts-check
/** @typedef {(rawTailwindConfig: string) => Promise<object>} CompileConfig */
/** @type {CompileConfig} */
export const compileConfig = async (rawTailwindConfig) => {
  // eslint-disable-next-line no-eval
  return eval(`(async () => { ${rawTailwindConfig} })()`);
};
