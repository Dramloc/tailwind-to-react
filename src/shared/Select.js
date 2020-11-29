/** @jsxImportSource @emotion/react */
import "twin.macro";

export const Select = ({ label, value, onChange, children }) => {
  return (
    <label tw="relative">
      <span tw="sr-only">{label}</span>
      <select
        tw="appearance-none block bg-transparent pr-6 py-1 text-gray-500 dark:text-gray-400 font-medium text-sm focus:outline-none focus:text-gray-900 dark:focus:text-white transition-colors duration-200"
        css={{ textAlignLast: "right" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <svg
        tw="w-5 h-5 text-gray-400 dark:text-gray-500 absolute top-1/2 right-0 -mt-2.5 pointer-events-none"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        />
      </svg>
    </label>
  );
};

export const SelectOption = (props) => {
  return <option tw="text-gray-900 bg-white dark:text-white dark:bg-gray-900" {...props} />;
};
