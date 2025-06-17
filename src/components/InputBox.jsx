const InputBox = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  buttonLabel = "Submit",
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter username"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="w-full font-medium py-3 px-4 transition-colors rounded-2xl"
        style={{
          backgroundColor: isLoading || !value.trim() ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer'
        }}
        onMouseOver={(e) => {
          if (!isLoading && value.trim()) {
            e.target.style.backgroundColor = '#2563eb';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading && value.trim()) {
            e.target.style.backgroundColor = '#3b82f6';
          }
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default InputBox;