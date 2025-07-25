const InputBox = ({ value, onChange, onSubmit, isLoading, buttonLabel = "Submit" }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value.trim()) onSubmit();
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter username"
        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default InputBox;
