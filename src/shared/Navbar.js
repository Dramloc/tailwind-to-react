export const Navbar = ({ start, end }) => {
  return (
    <header className="relative z-10 flex-none py-3 px-5 sm:px-6 flex items-center space-x-4 bg-white dark:bg-gray-900">
      <div className="flex-auto flex items-center min-w-0">{start}</div>
      <div className="flex items-center space-x-5">{end}</div>
    </header>
  );
};
