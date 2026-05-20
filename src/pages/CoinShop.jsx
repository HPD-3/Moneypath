import React, { useEffect, useState } from "react";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

export default function CoinShop() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [buying, setBuying] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [catRes, lvlRes] = await Promise.all([API.get("/shop/catalog"), API.get("/levels")]);
      setItems(catRes.data.items || []);
      setCoins(lvlRes.data.coins || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleBuy = async (id) => {
    if (!confirm("Confirm purchase?")) return;
    setBuying(id);
    try {
      const res = await API.post("/shop/purchase", { itemId: id });
      alert(res.data.message || "Purchased");
      setCoins(res.data.coins);
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Purchase failed");
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="flex h-screen bg-emerald-50">
      <Sidebar active="levels" setActive={() => {}} isOpen={false} setOpen={() => {}} handleLogout={() => {}} />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Coin Shop</h1>
          <p className="text-sm text-gray-600 mb-6">Spend your coins to unlock themes, avatar borders, and more.</p>

          <div className="mb-6">
            <div className="inline-block bg-white p-3 rounded-lg shadow border">
              <p className="text-xs text-gray-500">Your Coins</p>
              <p className="font-semibold text-lg text-emerald-700">{coins} 🪙</p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 bg-white rounded shadow-md">Loading shop...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">{item.price} 🪙</p>
                      <button disabled={buying===item.id} onClick={() => handleBuy(item.id)} className="mt-2 px-3 py-1 rounded-full bg-amber-500 text-white">{buying===item.id?"Buying...":"Buy"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
