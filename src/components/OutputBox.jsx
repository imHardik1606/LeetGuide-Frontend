const OutputBox = ({ guidance, isVisible, username, title = "Output" }) => {
  if (!isVisible) return null;

  const lines = guidance
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Detect if the content is already numbered (e.g., "1. Do this")
  const isNumberedList = lines.every((line) => /^\d+\.\s/.test(line));

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <h4 className="text-lg font-medium text-orange-600 mb-4">@{username}</h4>

        {isNumberedList ? (
          <div className="space-y-3 text-gray-800 text-base text-left leading-relaxed">
            {lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-800 text-base text-left leading-relaxed whitespace-pre-line">
            {lines.join("\n")}
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputBox;
