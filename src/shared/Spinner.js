/** @jsxImportSource @emotion/react */
import "twin.macro";

export const Spinner = ({ children = "Loading", ...props }) => {
  return (
    <div {...props}>
      <span tw="sr-only">{children}</span>
      <svg fill="none" viewBox="0 0 24 24" tw="w-4 h-4 animate-spin">
        <circle tw="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          tw="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};
