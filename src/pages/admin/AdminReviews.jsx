import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import StyledAlert, { useAlert, useConfirm, ConfirmDialog } from "../../components/StyledAlert.jsx";

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReview, setSelectedReview] = useState(null);
    const { alert, showAlert, hideAlert } = useAlert();
    const { confirm, showConfirm, hideConfirm } = useConfirm();

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const reviewsRef = collection(db, "reviews");
            const q = query(reviewsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const reviewsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
            }));

            setReviews(reviewsData);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId) => {
        try {
            const reviewRef = doc(db, "reviews", reviewId);
            await updateDoc(reviewRef, { approved: true, status: "approved" });
            fetchReviews();
        } catch (error) {
            console.error("Error approving review:", error);
            showAlert("Gagal menyetujui review", "error");
        }
    };

    const handleReject = async (reviewId) => {
        try {
            const reviewRef = doc(db, "reviews", reviewId);
            await updateDoc(reviewRef, { approved: false, status: "rejected" });
            fetchReviews();
        } catch (error) {
            console.error("Error rejecting review:", error);
            showAlert("Gagal menolak review", "error");
        }
    };

    const handleDelete = async (reviewId) => {
        showConfirm(
            "Hapus review ini?",
            async () => {
                await deleteDoc(doc(db, "reviews", reviewId));
                fetchReviews();
                setSelectedReview(null);
            }
        );
    };

    const getReviewStatus = (review) => {
        if (review.status === "rejected") return "rejected";
        return review.approved ? "approved" : "pending";
    };

    const filteredReviews = reviews.filter((review) => {
        const status = getReviewStatus(review);
        const matchesFilter = filter === "all" || status === filter;
        const matchesSearch =
            review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.userEmail && review.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesFilter && matchesSearch;
    });

    const statusCounts = {
        all: reviews.length,
        pending: reviews.filter((r) => getReviewStatus(r) === "pending").length,
        approved: reviews.filter((r) => getReviewStatus(r) === "approved").length,
        rejected: reviews.filter((r) => getReviewStatus(r) === "rejected").length,
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <StyledAlert message={alert?.message} type={alert?.type} onClose={hideAlert} />
            <ConfirmDialog 
                message={confirm?.message} 
                onConfirm={confirm?.onConfirm}
                onCancel={confirm?.onCancel}
                onClose={hideConfirm}
            />
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Manajemen Review</h1>
                    <p className="text-gray-600 text-sm">Kelola review pengguna dan persetujuan</p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { key: "all", label: "Total Review", color: "from-blue-400 to-blue-600" },
                    { key: "pending", label: "Menunggu", color: "from-yellow-400 to-yellow-600" },
                    { key: "approved", label: "Disetujui", color: "from-green-400 to-green-600" },
                    { key: "rejected", label: "Ditolak", color: "from-red-400 to-red-600" },
                ].map((stat) => (
                    <div
                        key={stat.key}
                        className={`bg-gradient-to-br ${stat.color} text-white p-4 rounded-xl shadow`}
                    >
                        <div className="text-3xl font-bold">{statusCounts[stat.key]}</div>
                        <div className="text-sm opacity-90">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* FILTER & SEARCH */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="flex gap-4 flex-wrap">
                    {["all", "pending", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                filter === status
                                    ? "bg-[#9FF782] text-black"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {status === "all" && "Semua"}
                            {status === "pending" && "Menunggu"}
                            {status === "approved" && "Disetujui"}
                            {status === "rejected" && "Ditolak"}
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Cari nama, review, atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                    />
                </div>
            </div>

            {/* REVIEWS TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Nama</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Review</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Rating</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Tanggal</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada review
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map((review) => {
                                    const status = getReviewStatus(review);
                                    return (
                                        <tr
                                            key={review.id}
                                            className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedReview(review)}
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {review.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">
                                                <div className="max-w-xs truncate">{review.review}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                                                        >
                                                            ⭐
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        status === "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : status === "rejected"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {status === "approved" && "✓ Disetujui"}
                                                    {status === "rejected" && "✗ Ditolak"}
                                                    {status === "pending" && "⏳ Menunggu"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-xs">
                                                {review.createdAt
                                                    ? new Date(review.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedReview(review);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    Lihat
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {selectedReview && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-[#0b2a17] to-[#123d23] text-white p-6 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Detail Review</h2>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-6 space-y-6">
                            {/* USER INFO */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Informasi Pengguna</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Nama:</span>
                                        <p className="font-medium text-gray-900">{selectedReview.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <p className="font-medium text-gray-900">{selectedReview.userEmail || "—"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Rating:</span>
                                        <p className="font-medium text-gray-900 flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < selectedReview.rating ? "text-yellow-400" : "text-gray-300"}>
                                                    ⭐
                                                </span>
                                            ))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* REVIEW TEXT */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Review</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedReview.review}
                                </p>
                            </div>

                            {/* STATUS & TIME */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <p className="font-medium">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    getReviewStatus(selectedReview) === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : getReviewStatus(selectedReview) === "rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {getReviewStatus(selectedReview) === "approved" && "✓ Disetujui"}
                                                {getReviewStatus(selectedReview) === "rejected" && "✗ Ditolak"}
                                                {getReviewStatus(selectedReview) === "pending" && "⏳ Menunggu"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Tanggal:</span>
                                        <p className="font-medium text-gray-900">
                                            {selectedReview.createdAt
                                                ? new Date(selectedReview.createdAt).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 pt-4 border-t">
                                {getReviewStatus(selectedReview) !== "approved" && (
                                    <button
                                        onClick={() => {
                                            handleApprove(selectedReview.id);
                                            setSelectedReview(null);
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <iconify-icon icon="mdi:check" className="text-xl"></iconify-icon>
                                        <span>Setujui</span>
                                    </button>
                                )}
                                {getReviewStatus(selectedReview) !== "rejected" && (
                                    <button
                                        onClick={() => {
                                            handleReject(selectedReview.id);
                                            setSelectedReview(null);
                                        }}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <iconify-icon icon="mdi:close" className="text-xl"></iconify-icon>
                                        <span>Tolak</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        handleDelete(selectedReview.id);
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <iconify-icon icon="mdi:trash-can" className="text-xl"></iconify-icon>
                                    <span>Hapus</span>
                                </button>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-all"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
