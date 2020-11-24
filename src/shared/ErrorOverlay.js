export const ErrorOverlay = ({ origin, error }) => {
  if (!error) {
    return null;
  }
  return (
    <div className="absolute inset-0 w-full h-full p-6 bg-red-50 text-red-700">
      <h2 className="text-base leading-6 font-semibold text-red-900 mb-4 flex items-center">
        <span className="bg-red-500 rounded-full w-4 h-4 border-4 border-red-200" />
        <span className="ml-3.5">{origin} error</span>
      </h2>
      <pre className="font-mono text-xs leading-4 overflow-y-auto">{error.message}</pre>
    </div>
  );
};
