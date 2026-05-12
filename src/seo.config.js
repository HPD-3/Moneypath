const SITE_URL = "https://moneypath.my.id";

/** Fintech WebApplication JSON-LD — used on public pages */
export const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MoneyPath",
  url: SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "MoneyPath adalah platform manajemen keuangan pribadi berbasis web. Catat pemasukan, pengeluaran, tabungan, dan pantau kesehatan finansial Anda secara real-time.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  publisher: {
    "@type": "Organization",
    name: "MoneyPath",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
    },
  },
};

/** Per-route SEO metadata */
const seoConfig = {
  "/": {
    title: "Kelola Keuangan Pribadi dengan Mudah",
    description:
      "MoneyPath membantu Anda mencatat pemasukan, pengeluaran, dan tabungan secara cerdas. Mulai perjalanan finansial sehat Anda hari ini — gratis.",
    canonical: "/",
    robots: "index, follow",
    jsonLd: webAppJsonLd,
  },
  "/login": {
    title: "Masuk ke Akun",
    description:
      "Masuk ke MoneyPath dan pantau keuangan pribadi Anda. Lacak pengeluaran, tabungan, dan laporan bulanan dalam satu dashboard.",
    canonical: "/login",
    robots: "noindex, follow",
  },
  "/register": {
    title: "Daftar Akun Gratis",
    description:
      "Buat akun MoneyPath gratis dan mulai kelola keuangan Anda dengan lebih teratur. Daftar hanya butuh beberapa detik.",
    canonical: "/register",
    robots: "noindex, follow",
  },
  "/dashboard": {
    title: "Dashboard Keuangan",
    description:
      "Lihat ringkasan keuangan Anda — total pemasukan, pengeluaran, saldo, dan grafik tren bulanan di satu halaman.",
    canonical: "/dashboard",
    robots: "noindex, nofollow",
  },
  "/balance": {
    title: "Catatan Transaksi",
    description:
      "Catat dan kelola semua transaksi keuangan Anda. Filter berdasarkan kategori, tanggal, dan jenis transaksi.",
    canonical: "/balance",
    robots: "noindex, nofollow",
  },
  "/tabungan": {
    title: "Target Tabungan",
    description:
      "Buat dan pantau target tabungan Anda. Tetapkan tujuan finansial dan lacak progres menuju kebebasan finansial.",
    canonical: "/tabungan",
    robots: "noindex, nofollow",
  },
  "/personal": {
    title: "Analisis Keuangan Personal",
    description:
      "Analisis mendalam keuangan pribadi Anda dengan grafik dan insight AI untuk keputusan finansial yang lebih baik.",
    canonical: "/personal",
    robots: "noindex, nofollow",
  },
  "/profile": {
    title: "Profil Pengguna",
    description: "Kelola informasi profil dan preferensi akun MoneyPath Anda.",
    canonical: "/profile",
    robots: "noindex, nofollow",
  },
  "/settings": {
    title: "Pengaturan Akun",
    description: "Atur preferensi notifikasi, keamanan, dan tampilan akun MoneyPath Anda.",
    canonical: "/settings",
    robots: "noindex, nofollow",
  },
  "/video": {
    title: "Video Edukasi Keuangan",
    description:
      "Tonton video edukasi keuangan pilihan untuk meningkatkan literasi finansial dan kemampuan mengelola uang Anda.",
    canonical: "/video",
    robots: "noindex, nofollow",
  },
  "/learning": {
    title: "Learning Path Keuangan",
    description:
      "Ikuti jalur belajar keuangan terstruktur untuk membangun kebiasaan finansial yang sehat dan cerdas.",
    canonical: "/learning",
    robots: "noindex, nofollow",
  },
  "/quiz": {
    title: "Kuis Keuangan Harian",
    description:
      "Uji pengetahuan keuangan Anda dengan kuis harian dan tingkatkan literasi finansial Anda setiap hari.",
    canonical: "/quiz",
    robots: "noindex, nofollow",
  },
  "/rekap": {
    title: "Rekap Keuangan Bulanan",
    description:
      "Lihat rekap lengkap keuangan bulanan Anda — pemasukan, pengeluaran, dan analisis tren finansial.",
    canonical: "/rekap",
    robots: "noindex, nofollow",
  },
};

export default seoConfig;
