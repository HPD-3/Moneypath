import { useState } from "react";
import { StarRating } from "./StarRating";

/**
 * ReviewForm - Form for users to submit reviews with name, text, and star rating
 */
export function ReviewForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: "",
    review: "",
    rating: 0,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama harus diisi";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter";
    }

    if (!formData.review.trim()) {
      newErrors.review = "Review harus diisi";
    } else if (formData.review.trim().length < 10) {
      newErrors.review = "Review minimal 10 karakter";
    }

    if (formData.rating === 0) {
      newErrors.rating = "Silakan berikan rating bintang";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: "",
      review: "",
      rating: 0,
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Nama Anda
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Masukkan nama Anda..."
          className="w-full px-4 py-2 rounded-lg bg-[#f0f0f0] border border-black text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[black] focus:border-transparent"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Berikan Rating
        </label>
        <div className="flex items-center">
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) =>
              setFormData((prev) => ({ ...prev, rating }))
            }
            size="lg"
          />
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-400">{errors.rating}</p>
        )}
      </div>

      {/* Review Textarea */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Review Anda
        </label>
        <textarea
          name="review"
          value={formData.review}
          onChange={handleChange}
          placeholder="Bagikan pengalaman Anda menggunakan MoneyPath..."
          rows="5"
          className="w-full px-4 py-2 rounded-lg bg-[#f0f0f0] border border-black text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#172619] focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-black">
          {formData.review.length}/500 karakter
        </p>
        {errors.review && (
          <p className="mt-1 text-sm text-red-400">{errors.review}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 rounded-lg bg-[#172619] text-[white] font-semibold hover:bg-[#8FE670] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Mengirim..." : "Kirim Review"}
      </button>
    </form>
  );
}
