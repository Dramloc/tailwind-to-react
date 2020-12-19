// @ts-check
/** @jsxImportSource @emotion/react */
import "twin.macro";

/** @type {React.FC<{ start?: JSX.Element, end?: JSX.Element } & import("react").HTMLAttributes<HTMLElement>} */
export const Navbar = ({ start, end, ...props }) => {
  return (
    <header tw="relative h-14 z-10 py-2 px-5 sm:px-6 flex items-center space-x-4" {...props}>
      <div tw="flex-auto flex items-center min-w-0">{start}</div>
      <div tw="flex items-center space-x-5">{end}</div>
    </header>
  );
};
