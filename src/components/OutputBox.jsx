const OutputBox = ({ guidance, isVisible, username, title = "Output" }) => {
  if (!isVisible) return null;

  const lines = guidance
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const isNumberedList = lines.every((line) => /^\d+\.\s/.test(line));

  // Apply special style to specific section headings
  const formatLine = (line) => {
    const boldHeadings = [
      "Strengths:",
      "Weaknesses:",
      "Big Tech Focus:",
      "CP Insights:",
      "Consistency Review:",
      "Action Plan:"
    ];

    const matchedHeading = boldHeadings.find((heading) =>
      line.includes(heading)
    );

    if (matchedHeading) {
      return (
        <p key={line} className="text-lg font-bold text-gray-900 pt-4">
          {line}
        </p>
      );
    }

    return (
      <p key={line} className="text-gray-800 text-base text-left leading-relaxed">
        {line}
      </p>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4 sm:px-6">
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <h4 className="text-lg font-semibold text-orange-600 mb-4 break-words">
          <a
            href={`https://leetcode.com/u/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{username}
          </a>
        </h4>

        {isNumberedList ? (
          <div className="space-y-3 text-gray-800 text-base text-left leading-relaxed">
            {lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-left">
            {lines.map((line) => formatLine(line))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputBox;
