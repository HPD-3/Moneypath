import { StarRating } from "./StarRating";

/**
 * TestimonialCard - Premium glassmorphic testimonial card component
 * Features: glassmorphism design, hover animations, smooth transitions, star ratings
 */
export function TestimonialCard({ quote, name, role, rating = 0 }) {
  return (
    <div className="group w-full h-full">
      {/* Card container with glassmorphism */}
      <div className="relative min-h-[280px] p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:bg-white/15 hover:border-white/20 flex flex-col">
        
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#9FF782]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Content wrapper */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Star Rating */}
          {rating > 0 && (
            <div className="mb-4">
              <StarRating rating={rating} size="sm" />
            </div>
          )}

          {/* Quote */}
          <p className="text-base leading-relaxed text-gray-100 font-light mb-6">
            "{quote}"
          </p>

          {/* Author info */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            {/* Avatar circle */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9FF782] to-[#7FD75F] flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg
                className="w-6 h-6 text-[#0B2E1E]"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            {/* Name and role */}
            <div>
              <p className="font-semibold text-white text-sm">{name}</p>
              <p className="text-xs text-gray-300">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
