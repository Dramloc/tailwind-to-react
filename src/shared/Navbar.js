/** @jsxImportSource @emotion/react */
import "twin.macro";

export const Navbar = ({ start, end }) => {
  return (
    <header tw="relative z-10 py-3 px-5 sm:px-6 flex items-center space-x-4">
      <div tw="flex-auto flex items-center min-w-0">{start}</div>
      <div tw="flex items-center space-x-5">{end}</div>
    </header>
  );
};
