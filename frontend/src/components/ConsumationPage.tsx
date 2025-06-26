import { useState } from "react";
import {
  Plus,
  X,
  ShoppingCart,
  CupSoda,
  Cookie,
  Loader2,
  Settings2,
  BarChart3,
  AlertTriangle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useConsumation } from "../context/ConsumationContext";
import ConsumationReport from "../components/ConsumationReport";
import toast from "react-hot-toast";
import { useAuth } from '../context/AuthContext';

function ConsumationPage() {
  const {
    eatables,
    drinkables,
    addConsumable,
    sellConsumable,
    revenue,
    fetchConsumables,
    updateConsumable,
    deleteConsumable, // <- Make sure this exists in context!
  } = useConsumation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"eatable" | "drinkable">("eatable");
  const [addName, setAddName] = useState("");
  const [addStock, setAddStock] = useState(1);
  const [addUnitPrice, setAddUnitPrice] = useState(0);
  const [addTotalCost, setAddTotalCost] = useState(0);
  const [addSellPrice, setAddSellPrice] = useState(0);
  const { user } = useAuth();

  const [sellModal, setSellModal] = useState<{
    id: number;
    name: string;
    stock: number;
    price: number;
  } | null>(null);
  const [sellAmount, setSellAmount] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  const [editModal, setEditModal] = useState<{
    id: number;
    name: string;
    stock: number;
    price: number;
  } | null>(null);
  const [editStock, setEditStock] = useState(1);
  const [editPrice, setEditPrice] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [editUnitPrice, setEditUnitPrice] = useState(0);
  const [editTotalCost, setEditTotalCost] = useState(0);
  const [editSellPrice, setEditSellPrice] = useState(0);

  const [search, setSearch] = useState("");
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editName, setEditName] = useState("");

  // For delete
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openAddModal = (type: "eatable" | "drinkable") => {
    setAddType(type);
    setShowAddModal(true);
    setAddName("");
    setAddStock(1);
    setAddUnitPrice(0);
    setAddTotalCost(0);
    setAddSellPrice(0);
  };

  const handleAdd = async () => {
    setAddLoading(true);
    await addConsumable({
      name: addName,
      type: addType,
      stock: addStock,
      unit_price: addUnitPrice,
      total_cost: addTotalCost,
      sell_price: addSellPrice,
    });
    setAddLoading(false);
    setShowAddModal(false);
    setAddName("");
    setAddStock(1);
    setAddUnitPrice(0);
    setAddTotalCost(0);
    setAddSellPrice(0);
    fetchConsumables();
    toast.success(`${addType === "eatable" ? "Eatable" : "Drinkable"} added successfully!`);
  };

  const handleSell = async () => {
    if (sellModal) {
      setSellLoading(true);
      await sellConsumable(sellModal.id, sellAmount, sellModal.price); // sellModal.price is actually sell_price
      setSellLoading(false);
      setSellModal(null);
      setSellAmount(1);
      toast.success(`Sold ${sellAmount} of ${sellModal.name}!`);
    }
  };

  const openEditModal = (item: {
    id: number;
    name: string;
    stock: number;
    price?: number;
    unit_price?: number;
    total_cost?: number;
    sell_price?: number;
  }) => {
    setEditModal({
      id: item.id,
      name: item.name,
      stock: item.stock,
      price: item.price ?? 0,
    });
    setEditName(item.name);
    setEditStock(item.stock);
    setEditUnitPrice(item.unit_price ?? 0);
    setEditTotalCost(item.total_cost ?? 0);
    setEditSellPrice(item.sell_price ?? 0);
  };

  const handleEdit = async () => {
    if (editModal) {
      setEditLoading(true);
      await updateConsumable(
        editModal.id,
        editName,
        editStock,
        editUnitPrice,
        editTotalCost,
        editSellPrice
      );
      setEditLoading(false);
      setEditModal(null);
      fetchConsumables();
      toast.success(`Editing ${editName} successful!`);
    }
  };

  // Multi delete handler
  const handleDelete = async () => {
    if (selectedToDelete.size === 0) return;
    setDeleteLoading(true);
    for (const id of selectedToDelete) {
      await deleteConsumable(id);
    }
    setDeleteLoading(false);
    setSelectedToDelete(new Set());
    fetchConsumables();
    toast.success("Selected items deleted successfully!");
  };

  const handleCardDeleteClick = (id: number) => {
    setSelectedToDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (showReport) {
    return <ConsumationReport onBack={() => setShowReport(false)} />;
  }



  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">

      {/* Revenue Stats */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              color: 'green',
              icon: <ShoppingCart className="w-10 h-10 text-green-200" />,
              label: "Today's Revenue",
              value: revenue.today,
            },
            {
              color: 'yellow',
              icon: <Cookie className="w-10 h-10 text-yellow-200" />,
              label: 'This Week',
              value: revenue.week,
            },
            {
              color: 'blue',
              icon: <CupSoda className="w-10 h-10 text-blue-200" />,
              label: 'This Month',
              value: revenue.month,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-${item.color}-600 rounded-xl p-6 flex items-center space-x-4 shadow-lg`}
            >
              {item.icon}
              <div>
                <div className="text-gray-200 text-sm">{item.label}</div>
                <div className="text-2xl font-bold text-white">{item.value} DA</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
        {/* Left: Search */}
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-64"
          />
        </div>
        {/* Right: Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setOutOfStockOnly(!outOfStockOnly)}
            className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            {outOfStockOnly ? "Show All" : "Out of Stock"}
          </button>
          {user?.role === 'admin' && (
          <button
            onClick={() => setShowReport(!showReport)}
            className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
            {showReport ? "Back to Management" : "Report"}
          </button>                  
          )}

          {/* Show delete if outOfStockOnly is enabled */}
          {outOfStockOnly && user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg disabled:opacity-60"
              disabled={selectedToDelete.size === 0 || deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {selectedToDelete.size > 0
                ? `Delete (${selectedToDelete.size})`
                : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Eatables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Cookie className="w-6 h-6 mr-2 text-yellow-400" />
              Eatables
            </h2>
            {user?.role === 'admin' && (
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center"
              onClick={() => openAddModal("eatable")}
            >
              <Plus className="w-5 h-5 mr-1" /> Add
            </button>              
            )}
          </div>
          <ul
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            style={{ minHeight: 180 }}
          >
            {eatables
              .filter((item) => !outOfStockOnly || Number(item.stock) === 0)
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col justify-between bg-gray-800/80 p-4 rounded-xl shadow relative transition-all duration-100
                  ${
                    outOfStockOnly && Number(item.stock) === 0
                      ? selectedToDelete.has(item.id)
                        ? "border-2 border-red-600"
                        : "border-2 border-gray-700"
                      : ""
                  }
                  `}
                  onClick={() => {
                    if (outOfStockOnly && Number(item.stock) === 0) {
                      handleCardDeleteClick(item.id);
                    }
                  }}
                  style={{
                    cursor:
                      outOfStockOnly && Number(item.stock) === 0
                        ? "pointer"
                        : "auto",
                  }}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      {item.name}
                      {outOfStockOnly && Number(item.stock) === 0 && selectedToDelete.has(item.id) && (
                        <CheckCircle2 className="w-4 h-4 ml-1 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      Stock: <span className="font-bold">{item.stock}</span> |{" "}
                      <span className="font-bold">{item.sell_price} DA</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex mt-4 space-x-2">
                    <button
                      className={`px-3 py-1 rounded flex-1 flex items-center justify-center
                      ${
                        Number(item.stock) === 0
                          ? "bg-red-600 cursor-not-allowed opacity-70"
                          : "bg-green-600 hover:bg-green-700"
                      }
                      text-white`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSellModal({
                          id: item.id,
                          name: item.name,
                          stock: item.stock,
                          price: item.sell_price,
                        });
                      }}
                      disabled={Number(item.stock) === 0}
                    >
                      Sell
                    </button>
                    <button
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Overlay for out of stock and in delete mode */}
                  {outOfStockOnly &&
                    Number(item.stock) === 0 &&
                    selectedToDelete.has(item.id) && (
                      <div className="absolute inset-0 bg-red-700/10 rounded-xl pointer-events-none transition-all duration-100" />
                    )}
                </li>
              ))}
            {eatables.length === 0 && (
              <li className="text-gray-400 text-center py-8 bg-gray-800/60 rounded-xl col-span-3">
                No eatables found.
              </li>
            )}
          </ul>
        </div>
        {/* Drinkables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <CupSoda className="w-6 h-6 mr-2 text-blue-300" />
              Drinkables
            </h2>
            {user?.role === 'admin' &&(
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                onClick={() => openAddModal("drinkable")}
              >
                <Plus className="w-5 h-5 mr-1" /> Add
              </button> 
            )}

          </div>
          <ul
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            style={{ minHeight: 180 }}
          >
            {drinkables
              .filter((item) => !outOfStockOnly || Number(item.stock) === 0)
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col justify-between bg-gray-800/80 p-4 rounded-xl shadow relative transition-all duration-100
                  ${
                    outOfStockOnly && Number(item.stock) === 0
                      ? selectedToDelete.has(item.id)
                        ? "border-2 border-red-600"
                        : "border-2 border-gray-700"
                      : ""
                  }
                  `}
                  onClick={() => {
                    if (outOfStockOnly && Number(item.stock) === 0) {
                      handleCardDeleteClick(item.id);
                    }
                  }}
                  style={{
                    cursor:
                      outOfStockOnly && Number(item.stock) === 0
                        ? "pointer"
                        : "auto",
                  }}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      {item.name}
                      {outOfStockOnly && Number(item.stock) === 0 && selectedToDelete.has(item.id) && (
                        <CheckCircle2 className="w-4 h-4 ml-1 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      Stock: <span className="font-bold">{item.stock}</span> |{" "}
                      <span className="font-bold">{item.sell_price} DA</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex mt-4 space-x-2">
                    <button
                      className={`px-3 py-1 rounded flex-1 flex items-center justify-center
                      ${
                        Number(item.stock) === 0
                          ? "bg-red-600 cursor-not-allowed opacity-70"
                          : "bg-green-600 hover:bg-green-700"
                      }
                      text-white`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSellModal({
                          id: item.id,
                          name: item.name,
                          stock: item.stock,
                          price: item.sell_price,
                        });
                      }}
                      disabled={Number(item.stock) === 0}
                    >
                      Sell
                    </button>
                    <button
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Overlay for out of stock and in delete mode */}
                  {outOfStockOnly &&
                    Number(item.stock) === 0 &&
                    selectedToDelete.has(item.id) && (
                      <div className="absolute inset-0 bg-red-700/10 rounded-xl pointer-events-none transition-all duration-100" />
                    )}
                </li>
              ))}
            {drinkables.length === 0 && (
              <li className="text-gray-400 text-center py-8 bg-gray-800/60 rounded-xl col-span-3">
                No drinkables found.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Floating Add Button (Mobile) */}
      <button
        className="fixed bottom-8 right-8 bg-purple-700 hover:bg-purple-800 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 md:hidden"
        onClick={() => setShowAddModal(true)}
        title="Add Consumable"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-700 w-96 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowAddModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-purple-700" />
              Add {addType === "eatable" ? "Eatable" : "Drinkable"}
            </h3>
            <div className="mb-3">
              <label className="block mb-1 text-white">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="bg-gray-800  border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter name"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-white">Stock</label>
              <input
                type="number"
                min={1}
                value={addStock}
                onChange={(e) => setAddStock(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-white">Unit Price (DA)</label>
              <input
                type="number"
                min={0}
                value={addUnitPrice}
                onChange={(e) => setAddUnitPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-white">Total Cost ({addStock * addUnitPrice}DA)</label>
              <input
                type="number"
                min={0}
                value={addTotalCost}
                onChange={(e) => setAddTotalCost(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Sell Price (DA)</label>
              <input
                type="number"
                min={0}
                value={addSellPrice}
                onChange={(e) => setAddSellPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleAdd}
                disabled={
                  addLoading ||
                  !addName ||
                  addStock < 1 ||
                  addUnitPrice < 0 ||
                  addTotalCost < 0 ||
                  addSellPrice < 0
                }
              >
                {addLoading && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-700 w-96 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setSellModal(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-green-700" />
              Sell {sellModal.name}
            </h3>
            <div className="mb-6">
              <label className="block mb-1 text-white">Amount</label>
              <input
                type="number"
                min={1}
                max={sellModal.stock}
                value={sellAmount}
                onChange={(e) => setSellAmount(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                In stock: {sellModal.stock}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setSellModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleSell}
                disabled={
                  sellLoading || sellAmount < 1 || sellAmount > sellModal.stock
                }
              >
                {sellLoading && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Confirm Sell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-700 w-96 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setEditModal(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center">
              <Settings2 className="w-5 h-5 mr-2 text-white" />
              Edit {editModal.name}
            </h3>
            <div className="mb-3">
              <label className="block mb-1 text-white">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-white">Stock</label>
              <input
                type="number"
                min={0}
                value={editStock}
                onChange={(e) => setEditStock(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Price (DA)</label>
              <input
                type="number"
                min={1}
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Unit Price</label>
              <input
                type="number"
                value={editUnitPrice}
                onChange={(e) => setEditUnitPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Total Cost</label>
              <input
                type="number"
                value={editTotalCost}
                onChange={(e) => setEditTotalCost(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Sell Price</label>
              <input
                type="number"
                value={editSellPrice}
                onChange={(e) => setEditSellPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleEdit}
                disabled={editLoading || editStock < 0 || editPrice < 1}
              >
                {editLoading && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsumationPage;