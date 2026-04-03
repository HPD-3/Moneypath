import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function SharedBalanceList() {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        currency: "IDR",
    });

    const [invites, setInvites] = useState([]); // ✅ NEW
    const navigate = useNavigate();

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const [balanceRes, inviteRes] = await Promise.all([
                API.get("/sharedbalance"),
                API.get("/sharedbalance/invitations/me")
            ]);

            setBalances(balanceRes.data);
            setInvites(inviteRes.data || []);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            const res = await API.post("/sharedbalance", formData);

            setBalances([...balances, res.data]);

            setFormData({
                name: "",
                description: "",
                currency: "IDR"
            });

            setShowCreateForm(false);

        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptInvite = async (balanceId, inviteId) => {
        try {
            await API.post(`/sharedbalance/${balanceId}/invitations/${inviteId}/accept`);
            alert("Joined successfully!");
            fetchBalances();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f4f0]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#9FF782] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f4f0] font-[Plus Jakarta Sans]">
            {/* CONTAINER */}
            <div className="max-w-[480px] mx-auto px-4 py-6">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-[#1a3a1f]">
                        👥 Shared Balance
                    </h1>
                    <p className="text-sm text-gray-500">
                        Kelola pengeluaran bersama
                    </p>
                </div>

                {/* 🔔 INVITATIONS */}
                {invites.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Invitations
                        </p>

                        <div className="space-y-3">
                            {invites.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="bg-[#fffbea] border border-yellow-300 rounded-xl p-4 shadow-sm"
                                >
                                    <p className="text-sm font-semibold text-yellow-800">
                                        📩 You are invited
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        {inv.email}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Balance ID: {inv.balanceId}
                                    </p>

                                    <button
                                        onClick={() => handleAcceptInvite(inv.balanceId, inv.id)}
                                        className="mt-3 w-full bg-[#1a3a1f] text-[#9FF782] py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                                    >
                                        Accept Invite
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CREATE BUTTON */}
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full mb-5 bg-[#1a3a1f] text-[#9FF782] py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
                >
                    + Create Shared Balance
                </button>

                {/* CREATE FORM */}
                {showCreateForm && (
                    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
                        <form onSubmit={handleCreate} className="space-y-3">

                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Balance Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />

                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />

                            <select
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                value={formData.currency}
                                onChange={(e) =>
                                    setFormData({ ...formData, currency: e.target.value })
                                }
                            >
                                <option value="IDR">IDR</option>
                                <option value="USD">USD</option>
                            </select>

                            <button
                                type="submit"
                                className="w-full bg-[#9FF782] text-[#0f2a18] py-2 rounded-lg font-semibold"
                            >
                                Create
                            </button>
                        </form>
                    </div>
                )}

                {/* BALANCE LIST */}
                <div className="space-y-4">
                    {balances.map((b) => (
                        <div
                            key={b.id}
                            onClick={() => navigate(`/sharedbalance/${b.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-[#1a3a1f]">
                                    {b.name}
                                </h3>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {b.currency}
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 mb-2">
                                {b.description}
                            </p>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total</span>
                                <span className="font-semibold text-[#1a3a1f]">
                                    {b.currency} {b.totalBalance}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}