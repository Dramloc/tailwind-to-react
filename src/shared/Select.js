/** @jsxImportSource @emotion/react */
import "twin.macro";

export const Select = ({ label, value, onChange, children }) => {
  return (
    <label tw="relative">
      <span tw="sr-only">{label}</span>
      <select
        tw="bg-transparent border-none text-gray-500 dark:text-gray-400 font-medium text-sm focus:outline-none focus:text-gray-900 dark:focus:text-white transition-colors duration-200 focus:ring-0"
        css={{ textAlignLast: "right" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
};

export const SelectOption = (props) => {
  return <option tw="text-gray-900 bg-white dark:text-white dark:bg-gray-900" {...props} />;
};
