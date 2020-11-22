/** @type {(value: string) => string} */
export const upperFirst = (value) => {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};
