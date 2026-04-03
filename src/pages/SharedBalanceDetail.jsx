import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function SharedBalanceDetail() {
    const { balanceId } = useParams();
    const navigate = useNavigate();

    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [settlement, setSettlement] = useState(null);
    const [invites, setInvites] = useState([]);

    const [activeTab, setActiveTab] = useState("transactions");
    const [loading, setLoading] = useState(true);

    const [showAddTx, setShowAddTx] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    const [inviteEmail, setInviteEmail] = useState("");

    const [txForm, setTxForm] = useState({
        amount: "",
        paidBy: "",
        description: "",
        category: "general",
    });

    useEffect(() => {
        fetchAll();
    }, [balanceId]);

    const fetchAll = async () => {
        try {
            const [balRes, txRes, settlementRes, invitesRes] = await Promise.all([
                API.get(`/sharedbalance/${balanceId}`),
                API.get(`/sharedbalance/${balanceId}/transactions`),
                API.get(`/sharedbalance/${balanceId}/settlement`),
                API.get(`/sharedbalance/invitations/me`)
            ]);

            setBalance(balRes.data);
            setTransactions(txRes.data || []);
            setSettlement(settlementRes.data);
            setInvites(invitesRes.data || []);

            if (txForm.paidBy === "") {
                const firstMemberId = Object.keys(balRes.data.members || {})[0];
                setTxForm((prev) => ({ ...prev, paidBy: firstMemberId }));
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            await API.post(`/sharedbalance/${balanceId}/transactions`, {
                ...txForm,
                amount: parseFloat(txForm.amount),
            });

            setTxForm({
                amount: "",
                paidBy: "",
                description: "",
                category: "general"
            });

            setShowAddTx(false);
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await API.post(`/sharedbalance/${balanceId}/invite`, {
                email: inviteEmail,
                inviteType: "email",
            });

            setInviteEmail("");
            setShowInvite(false);
            alert("Invitation sent!");
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptInvite = async (inviteId) => {
        try {
            await API.post(`/sharedbalance/${balanceId}/invitations/${inviteId}/accept`);
            alert("Joined successfully!");
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f4f0]">
                <div className="w-8 h-8 border-4 border-[#9FF782] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!balance) return <p className="p-6">Balance not found</p>;

    const memberIds = Object.keys(balance.members || {});

    return (
        <div className="min-h-screen bg-[#f0f4f0]">
            <div className="max-w-[480px] mx-auto px-4 py-6">

                {/* 🔙 BACK */}
                <button
                    onClick={() => navigate("/sharedbalance")}
                    className="mb-4 text-sm text-gray-500 hover:text-black"
                >
                    ← Back
                </button>

                {/* 🔔 INVITE ALERT */}
                {invites
                    .filter(inv => inv.balanceId === balanceId)
                    .map(inv => (
                        <div key={inv.id} className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mb-4">
                            <p className="text-sm font-semibold text-yellow-800">
                                📩 You are invited to join this balance
                            </p>
                            <button
                                onClick={() => handleAcceptInvite(inv.id)}
                                className="mt-2 w-full bg-[#1a3a1f] text-[#9FF782] py-2 rounded-lg"
                            >
                                Accept Invite
                            </button>
                        </div>
                    ))}

                {/* HEADER */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                    <h1 className="text-xl font-bold text-[#1a3a1f]">
                        {balance.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {balance.description}
                    </p>

                    <div className="mt-3 text-lg font-semibold">
                        {balance.currency} {balance.totalBalance?.toLocaleString()}
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setShowAddTx(!showAddTx)}
                        className="flex-1 bg-[#1a3a1f] text-[#9FF782] py-2 rounded-lg text-sm"
                    >
                        + Add
                    </button>

                    <button
                        onClick={() => setShowInvite(!showInvite)}
                        className="flex-1 bg-white border py-2 rounded-lg text-sm"
                    >
                        Invite
                    </button>
                </div>

                {/* ADD TRANSACTION */}
                {showAddTx && (
                    <form onSubmit={handleAddTransaction} className="bg-white p-4 rounded-xl mb-4 space-y-3">
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full border px-3 py-2 rounded-lg text-sm"
                            value={txForm.amount}
                            onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                        />

                        <select
                            className="w-full border px-3 py-2 rounded-lg text-sm"
                            value={txForm.paidBy}
                            onChange={(e) => setTxForm({ ...txForm, paidBy: e.target.value })}
                        >
                            {memberIds.map(id => (
                                <option key={id} value={id}>
                                    {balance.members[id].email}
                                </option>
                            ))}
                        </select>

                        <input
                            placeholder="Description"
                            className="w-full border px-3 py-2 rounded-lg text-sm"
                            value={txForm.description}
                            onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                        />

                        <button className="w-full bg-[#9FF782] py-2 rounded-lg font-semibold">
                            Add Transaction
                        </button>
                    </form>
                )}

                {/* INVITE FORM */}
                {showInvite && (
                    <form onSubmit={handleInvite} className="bg-white p-4 rounded-xl mb-4 space-y-3">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full border px-3 py-2 rounded-lg text-sm"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />

                        <button className="w-full bg-[#1a3a1f] text-[#9FF782] py-2 rounded-lg">
                            Send Invite
                        </button>
                    </form>
                )}

                {/* TABS */}
                <div className="flex mb-4 bg-white rounded-lg overflow-hidden">
                    {["transactions", "members", "settlement"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-sm ${activeTab === tab
                                ? "bg-[#1a3a1f] text-[#9FF782]"
                                : "text-gray-500"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="space-y-3">

                    {activeTab === "transactions" &&
                        transactions.map(tx => (
                            <div key={tx.id} className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="font-semibold">{tx.description}</p>
                                <p className="text-xs text-gray-500">{tx.paidByEmail}</p>
                                <p className="text-sm font-bold mt-1">{tx.amount}</p>
                            </div>
                        ))
                    }

                    {activeTab === "members" &&
                        memberIds.map(id => (
                            <div key={id} className="bg-white p-3 rounded-lg">
                                <p className="font-semibold">{balance.members[id].email}</p>
                                <p className="text-xs text-gray-500">{balance.members[id].role}</p>
                            </div>
                        ))
                    }

                    {activeTab === "settlement" && settlement &&
                        settlement.settlements?.map((s, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg">
                                <p className="text-sm">
                                    {s.fromEmail} → {s.toEmail}
                                </p>
                                <p className="font-semibold">{s.amount}</p>
                            </div>
                        ))
                    }

                </div>

            </div>
        </div>
    );
}