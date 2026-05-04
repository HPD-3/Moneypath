/**
 * StarRating - Interactive star rating component (1-5 stars)
 * Can be used for display or input
 */
export function StarRating({ rating = 0, onRatingChange = null, size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange && onRatingChange(star)}
          className={`transition-colors ${starSize} ${
            onRatingChange ? "cursor-pointer hover:opacity-80" : "cursor-default"
          }`}
          disabled={!onRatingChange}
        >
          <svg
            className={`w-full h-full ${
              star <= rating ? "text-[#9FF782] fill-current" : "text-gray-400"
            }`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        </button>
      ))}
      {rating > 0 && <span className="ml-2 text-sm text-gray-300">{rating}/5</span>}
    </div>
  );
}
