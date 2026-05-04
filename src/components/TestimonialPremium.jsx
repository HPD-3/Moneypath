import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { TestimonialCard } from './TestimonialCard';
import lingkaran from '../assets/lingkaran.png';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * TestimonialPremium - Premium carousel section with glassmorphic cards
 * Features: Swiper carousel, autoplay, responsive breakpoints, glow effects, user reviews from Firebase
 */
export function TestimonialPremium() {
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const staticTestimonials = [
    {
      quote: "MoneyPath benar-benar mengubah cara saya mengelola keuangan. Dengan fitur pencatatan yang mudah, saya jadi lebih terarah dan bisa membuat financial plan yang jelas. Sekarang keuangan saya lebih rapi dan semua pengeluaran tercatat dengan baik sampai target tercapai.",
      name: "Nadia",
      role: "Student",
      rating: 5,
    },
    {
      quote: "Sebagai mahasiswa yang baru mandiri finansial, aplikasi ini sangat membantu untuk mengatur keuangan harian. Fitur dashboard yang intuitif membuat saya lebih sadar dengan pengeluaran, dan sekarang bisa mulai nabung dengan teratur. Rekomendasi banget buat teman-teman!",
      name: "Hannah",
      role: "Product engineer",
      rating: 5,
    },
    {
      quote: "Web ini keren banget! Tampilannya simpel dan modern, tapi fiturnya sangat lengkap. Dari pencatatan transaksi harian, perencanaan tabungan, sampai learning path yang edukatif semuanya ada. Interface yang clean membuat saya betah berlama-lama menggunakan aplikasi ini.",
      name: "Ammar",
      role: "Programmer",
      rating: 5,
    },
    {
      quote: "Fitur rekap bulanan di MoneyPath sangat membantu saya memahami pola pengeluaran dan sumber pemasukan dengan lebih baik. Visualisasi data yang jelas memberikan insight berharga untuk perencanaan keuangan ke depan. Tools ini benar-benar game changer untuk financial literacy saya.",
      name: "Lilya",
      role: "Programmer",
      rating: 5,
    },
  ];

  // Fetch user reviews from Firebase
  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        setLoading(true);
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        
        const reviews = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setUserReviews(reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, []);

  // Combine static testimonials with user reviews
  const allTestimonials = [...staticTestimonials, ...userReviews];

  // Add custom pagination styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .testimonial-pagination {
        bottom: 0 !important;
        position: relative;
        margin-top: 32px;
      }
      .testimonial-pagination .swiper-pagination-bullet {
        background: rgba(255, 255, 255, 0.4) !important;
        opacity: 1 !important;
        width: 10px !important;
        height: 10px !important;
        transition: all 0.3s ease !important;
      }
      .testimonial-pagination .swiper-pagination-bullet-active {
        background: #9FF782 !important;
        width: 30px !important;
        border-radius: 6px !important;
      }
      .testimonial-pagination .swiper-pagination-bullet:hover {
        background: rgba(159, 247, 130, 0.6) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <section id="testimonial" className="relative bg-gradient-to-b from-[#0B2E1E] to-[#081E13] text-white py-32 overflow-hidden">
      {/* Background image with reduced opacity */}
      <img
        src={lingkaran}
        className="absolute w-[800px] md:w-[1200px] opacity-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        alt=""
      />

      {/* Glow effect using blurred div */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#9FF782]/10 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#9FF782]/5 rounded-full filter blur-3xl opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-sm text-green-300 font-medium tracking-widest uppercase">
            Testimonial
          </h2>

          <h3 className="text-3xl md:text-5xl font-serif leading-tight mt-4 text-white">
            Don't take our word for it.
            <br />
            <span className="text-[#9FF782]">Over 100+ people trust us</span>
          </h3>

          <p className="text-gray-300 mt-6 max-w-2xl mx-auto text-base">
            Hear from real users who have transformed their financial lives with MoneyPath
          </p>
        </div>

        {/* Carousel */}
        <div className="px-4 md:px-8">
          {allTestimonials.length > 0 ? (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={24}
              slidesPerView={1.2}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: false,
              }}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 1.2,
                  spaceBetween: 24,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              className="testimonial-swiper"
              paginationClass="testimonial-pagination"
            >
              {allTestimonials.map((testimonial, index) => (
                <SwiperSlide key={index} className="pb-12">
                  <TestimonialCard
                    quote={testimonial.quote || testimonial.review}
                    name={testimonial.name}
                    role={testimonial.role || "User"}
                    rating={testimonial.rating || 0}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center text-gray-300">
              <p>Loading testimonials...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
