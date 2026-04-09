import React, { useState, useEffect } from "react";
import API from "../../services/api";

export default function AdminAktivitas() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAllModal, setShowAllModal] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await API.get("/admin/activities");
            setActivities(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Failed to fetch activities");
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).replace(/\//g, "-");
    };

    const openDetail = (activity) => {
        setSelectedActivity(activity);
        setShowDetailModal(true);
    };

    const recentActivities = activities.slice(0, 5);

    return (
        <div className="space-y-6 p-6">
            {/* PAGE HEADER */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">📋 Aktivitas Terbaru</h1>
                <p className="text-gray-600 mt-2">Pantau semua aktivitas admin dan konten yang ditambahkan</p>
            </div>

            {/* LOADING & ERROR */}
            {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700">Memuat aktivitas...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Error: {error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* RECENT ACTIVITIES TABLE */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aktivitas</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tanggal</th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((activity) => (
                                            <tr key={activity.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900 font-medium">{activity.action}</p>
                                                        <p className="text-gray-600">{activity.title}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(activity.date)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openDetail(activity)}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                                                    >
                                                        Lihat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada aktivitas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SEE ALL BUTTON */}
                    {activities.length > 5 && (
                        <div className="text-center">
                            <button
                                onClick={() => setShowAllModal(true)}
                                className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition"
                            >
                                ➜ Lihat Semua Aktivitas Terbaru ({activities.length})
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* DETAIL MODAL */}
            {showDetailModal && selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto shadow-xl">
                        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Detail Aktivitas</h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Aktivitas</label>
                                <p className="text-gray-900">{selectedActivity.action}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul</label>
                                <p className="text-gray-900 font-medium">{selectedActivity.title}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                                <p className="text-gray-900">{formatDate(selectedActivity.date)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
                                <p className="text-gray-900">
                                    {selectedActivity.details?.description || "—"}
                                </p>
                            </div>

                            {selectedActivity.type === "video" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">URL Video</label>
                                        <p className="text-blue-600 break-all text-sm">
                                            {selectedActivity.details?.videoUrl || "—"}
                                        </p>
                                    </div>
                                </>
                            )}

                            {selectedActivity.type === "path" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                                        <p className="text-gray-900">
                                            {selectedActivity.details?.category || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Modul</label>
                                        <p className="text-gray-900">
                                            {selectedActivity.details?.modules?.length || 0} modul
                                        </p>
                                    </div>
                                </>
                            )}

                            {selectedActivity.type === "module" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                                        <p className="text-gray-900">
                                            {selectedActivity.details?.category || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tingkat Kesulitan</label>
                                        <p className="text-gray-900">
                                            {selectedActivity.details?.difficulty || "—"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ALL ACTIVITIES MODAL */}
            {showAllModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-hidden shadow-xl flex flex-col">
                        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Semua Aktivitas Terbaru ({activities.length})</h3>
                            <button
                                onClick={() => setShowAllModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aktivitas</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tanggal</th>
                                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {activities.map((activity) => (
                                            <tr key={activity.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900 font-medium">{activity.action}</p>
                                                        <p className="text-gray-600">{activity.title}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(activity.date)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            openDetail(activity);
                                                            setShowAllModal(false);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                                                    >
                                                        Lihat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowAllModal(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
