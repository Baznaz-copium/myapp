import { useState, useRef, useEffect, useCallback } from "react";
import {Plus, X, ShoppingCart, CupSoda, Cookie, Loader2, Settings2, BarChart3, ClipboardMinus, AlertTriangle,Trash2, CheckCircle2, QrCode} from "lucide-react";
import { useConsumation } from "../context/ConsumationContext";
import ConsumationReport from "../components/ConsumationReport";
import toast from "react-hot-toast";
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { printReceipt } from '../hooks/printReceipt';

function ConsumationPage() {
  const {
    eatables,
    drinkables,
    addConsumable,
    sellConsumable,
    multiSellConsumable,
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
  const [addBarcode, setAddBarcode] = useState(""); // <-- Add this state
  const { user } = useAuth();
  const { settings } = useSettings();

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

  // Barcode scanner state
  const [showScanner, setShowScanner] = useState(false); // <-- Add this state
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItems, setScannedItems] = useState<any[]>([]); // <-- New state for scanned items
  const barcodeScannerInputRef = useRef<HTMLInputElement>(null);
  const addBarcodeInputRef = useRef<HTMLInputElement>(null);  // Listen for barcode input (keyboard) when scanner is shown
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  useEffect(() => {
    if (showAddModal && addBarcodeInputRef.current) {
      addBarcodeInputRef.current.focus();
    }
  }, [showAddModal]);
  
useEffect(() => {
  if (showScanner && barcodeScannerInputRef.current) {
    barcodeScannerInputRef.current.focus();
  }
}, [showScanner]);

  // Play sound effect if enabled in settings
  const playSound = () => {
    if (settings?.soundEffects) {
      const audio = new Audio('/sounds/click.wav'); // Put your sound in /public/sounds/
      audio.play();
    }
  };

  const openAddModal = (type: "eatable" | "drinkable") => {
    setAddType(type);
    setShowAddModal(true);
    setAddName("");
    setAddStock(1);
    setAddUnitPrice(0);
    setAddTotalCost(0);
    setAddSellPrice(0);
    setAddBarcode(""); // <-- Reset barcode
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
      barcode: addBarcode, // <-- Include barcode
    });
    setAddLoading(false);
    setShowAddModal(false);
    setAddName("");
    setAddStock(1);
    setAddUnitPrice(0);
    setAddTotalCost(0);
    setAddSellPrice(0);
    setAddBarcode(""); // <-- Reset barcode
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

  const eatablesScrollRef = useRef<HTMLUListElement>(null);
  const [isEatablesDown, setIsEatablesDown] = useState(false);
  const [eatablesStartY, setEatablesStartY] = useState(0);
  const [eatablesScrollTop, setEatablesScrollTop] = useState(0);

  const handleEatablesMouseDown = (e: React.MouseEvent) => {
    setIsEatablesDown(true);
    setEatablesStartY(e.pageY - (eatablesScrollRef.current?.offsetTop || 0));
    setEatablesScrollTop(eatablesScrollRef.current?.scrollTop || 0);
  };
  const handleEatablesMouseLeave = () => setIsEatablesDown(false);
  const handleEatablesMouseUp = () => setIsEatablesDown(false);
  const handleEatablesMouseMove = (e: React.MouseEvent) => {
    if (!isEatablesDown) return;
    e.preventDefault();
    const y = e.pageY - (eatablesScrollRef.current?.offsetTop || 0);
    const walk = (y - eatablesStartY) * 1.5;
    if (eatablesScrollRef.current)
      eatablesScrollRef.current.scrollTop = eatablesScrollTop - walk;
  };

  // Refs and drag state for drinkables
  const drinkablesScrollRef = useRef<HTMLUListElement>(null);
  const [isDrinkablesDown, setIsDrinkablesDown] = useState(false);
  const [drinkablesStartY, setDrinkablesStartY] = useState(0);
  const [drinkablesScrollTop, setDrinkablesScrollTop] = useState(0);

  const handleDrinkablesMouseDown = (e: React.MouseEvent) => {
    setIsDrinkablesDown(true);
    setDrinkablesStartY(e.pageY - (drinkablesScrollRef.current?.offsetTop || 0));
    setDrinkablesScrollTop(drinkablesScrollRef.current?.scrollTop || 0);
  };
  const handleDrinkablesMouseLeave = () => setIsDrinkablesDown(false);
  const handleDrinkablesMouseUp = () => setIsDrinkablesDown(false);
  const handleDrinkablesMouseMove = (e: React.MouseEvent) => {
    if (!isDrinkablesDown) return;
    e.preventDefault();
    const y = e.pageY - (drinkablesScrollRef.current?.offsetTop || 0);
    const walk = (y - drinkablesStartY) * 1.5;
    if (drinkablesScrollRef.current)
      drinkablesScrollRef.current.scrollTop = drinkablesScrollTop - walk;
  };

  // --- Barcode Scanner Modal ---
const handleBarcodeScan = useCallback(() => {
  if (!barcodeInput) return;
  const allItems = [...eatables, ...drinkables];
  const found = allItems.find(item => item.barcode === barcodeInput.trim());
  if (found) {
    setScannedItems(items => {
      const idx = items.findIndex(it => it.id === found.id);
      if (idx !== -1) {
        return items.map((it, i) =>
          i === idx ? { ...it, _qty: (it._qty || 1) + 1 } : it
        );
      }
      return [...items, { ...found, _qty: 1 }];
    });
    setLastScannedBarcode(barcodeInput); // <-- Save last scanned
    setBarcodeInput("");
    playSound && playSound();
    setTimeout(() => {
      barcodeScannerInputRef.current?.focus();
    }, 100);
  } else {
    toast.error("No item found for this barcode.");
    setTimeout(() => {
      barcodeScannerInputRef.current?.focus();
    }, 100);
  }
}, [barcodeInput, eatables, drinkables, playSound]);

  if (showReport) {
    return <ConsumationReport onBack={() => setShowReport(false)} />;
  }

  return (
    <>
    {/* Main container for floating button and content */}
    <div className="relative">    
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      {/* Floating Toggle Button - top right corner */}
      <div className="absolute top-0 right-0 z-20 m-2 md:translate-x-[200%] md:m-0">
        <div className="group relative">
          <button
            className="bg-green-700 hover:bg-green-800 text-white p-3 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
            onClick={() => {
              setShowScanner((prev) => !prev);
              setBarcodeResult(null);
            }}
            aria-label={showScanner ? "Show Revenue Cards" : "Show Barcode Scanner"}
          >
            {showScanner ? (
              <BarChart3 className="w-6 h-6" />
            ) : (
              <QrCode className="w-6 h-6" />
            )}
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900 text-white text-xs rounded px-3 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg z-10">
            {showScanner ? "Show Revenue Cards" : "Show Barcode Scanner"}
          </span>
        </div>
      </div>
      {!showScanner ? (
        <>
      {user?.role === 'admin' && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              color: 'green',
              icon: <ShoppingCart className="w-10 h-10 text-green-200" />,
              label: "Today's Revenue",
              value: typeof revenue === 'object' && revenue !== null && 'today' in revenue ? (revenue as any).today : revenue,
            },
            {
              color: 'yellow',
              icon: <Cookie className="w-10 h-10 text-yellow-200" />,
              label: 'This Week',
              value: typeof revenue === 'object' && revenue !== null && 'week' in revenue ? (revenue as any).week : revenue,
            },
            {
              color: 'blue',
              icon: <CupSoda className="w-10 h-10 text-blue-200" />,
              label: 'This Month',
              value: typeof revenue === 'object' && revenue !== null && 'month' in revenue ? (revenue as any).month : revenue,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-${item.color}-600 rounded-xl p-5 flex flex-col items-center shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-2">
                {item.icon}
                <span className="text-1xl font-bold text-white">{item.value} DA</span>
              </div>
              <div className="w-full">
                <div className="text-xs text-gray-200 uppercase tracking-widest text-center truncate">
                  {item.label.split(' ').map((word, i) => (
                    <span key={i}>
                      {word}
                      {i !== item.label.split(' ').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
     ) : (
        // Barcode Scanner UI
        <div className="flex flex-col items-center justify-center mb-8">
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-full relative"> 
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
              onClick={() => {
                setShowScanner(false);
                setBarcodeInput("");
                setScannedItems([]); // <-- Clear scanned items on close
              }}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6" /> Scan or Enter Barcode
            </h2>
            {/* Barcode Scan Section (always visible when showScanner) */}
            {showScanner && (
              <div className="w-full flex flex-col md:flex-row gap-4 bg-gray-900/80 rounded-xl p-4 mb-8 border border-gray-700">
                {/* Left: Barcode input */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <QrCode className="w-6 h-6" /> Scan Barcode
                  </h3>
                  <input
                    ref={barcodeScannerInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleBarcodeScan();
                      }
                    }}
                    className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg tracking-widest"
                    placeholder="Scan or type barcode and press Enter"
                    autoFocus
                  />
                  <div className="text-gray-400 text-sm">
                    Last scanned: <span className="text-white">{lastScannedBarcode}</span>
                  </div>
                </div>

                {/* Middle: List of scanned items */}
                <div className="flex-[2]">
                  <h3 className="text-white font-bold mb-2 text-center">Scanned Items</h3>

                  <ul   
                    className="divide-y divide-gray-700 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 cursor-grab"
                    style={{ minHeight: 60 }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const data = e.dataTransfer.getData("application/json");
                      if (!data) return;
                      const item = JSON.parse(data);
                      setScannedItems(items => {
                        const idx = items.findIndex(it => it.id === item.id);
                        if (idx !== -1) {
                          // Increment quantity if already scanned
                          return items.map((it, i) =>
                            i === idx ? { ...it, _qty: (it._qty || 1) + 1 } : it
                          );
                        }
                        // Add new item with quantity 1
                        return [...items, { ...item, _qty: 1 }];
                      });
                      setLastScannedBarcode(item.barcode || "");
                      playSound && playSound();
                    }}
                  >
                    {scannedItems.length > 0 ? (
                      scannedItems.map((item, idx) => (
                      <li key={item.id + '-' + idx} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between text-white gap-2">
                        <div className="flex-1">
                          <span className="font-semibold">{item.name}</span>
                          <span className="ml-2 text-sm text-gray-400">Stock: {item.stock}</span>
                          <span className="ml-2 font-bold">{Number(item.sell_price).toFixed(2)} DA</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item._qty || 1}
                            onChange={e => {
                              const qty = Math.max(1, Math.min(Number(e.target.value), item.stock));
                              setScannedItems(items =>
                                items.map((it, i) => i === idx ? { ...it, _qty: qty } : it)
                              );
                            }}
                            className="w-16 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
                          />
                          <input
                            type="number"
                            min={0}
                            value={item._price ?? item.sell_price}
                            onChange={e => {
                              setScannedItems(items =>
                                items.map((it, i) => i === idx ? { ...it, _price: Number(e.target.value) } : it)
                              );
                            }}
                            className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
                            placeholder="Price"
                          />
                        <div className="relative group">
                        <button
                          className="bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-white"
                          onClick={() =>
                            setScannedItems(items =>
                              items.filter((it, i) =>
                                i === idx
                                  ? (it._qty || 1) > 1 // If qty > 1, keep and decrement; else remove
                                    ? (items[i] = { ...it, _qty: (it._qty || 1) - 1 }) && true
                                    : false
                                  : true
                              )
                            )
                          }
                        >
                          <ClipboardMinus/>
                        </button>
                        <span className="absolute right-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900 text-white text-xs rounded px-3 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg z-20">
                          double click to remove item
                        </span>
                        </div>
                      </div>
                      </li>
                    )) 
                  ) : (
                    <li className="text-gray-400 text-center py-8 bg-transparent rounded-xl col-span-3">
                      No items scanned yet.
                    </li>
                  )}
                </ul>
                </div>

                {/* Right: Total and confirm */}
                <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-700 pl-4">
                  <h3 className="text-white font-bold mb-2">Total</h3>
                  <div className="text-3xl font-bold text-green-400 mb-4">
                    {scannedItems.reduce((sum, item) => sum + (item._qty || 1) * (item._price ?? item.sell_price), 0).toFixed(2)} DA
                  </div>
                  <button
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded mb-2"
                    disabled={scannedItems.length === 0}
                    onClick={async () => {            
                      await multiSellConsumable(scannedItems);
                      printReceipt(scannedItems, settings?.businessName || "My Shop");
                      toast.success("Sale confirmed!");
                      setScannedItems([]);
                      setBarcodeInput("");
                      fetchConsumables();
                    }}
                  >
                    Confirm All
                  </button>
                  <button
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                      onClick={() => {
                        setScannedItems([]);
                        setTimeout(() => {
                          barcodeScannerInputRef.current?.focus();
                        }, 100);
                      }}
                      disabled={scannedItems.length === 0}
                    >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
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
          {/* Eatables List */}
          <ul
            ref={eatablesScrollRef}
            className={`grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-x-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ${isEatablesDown ? "cursor-grabbing" : "cursor-grab"} select-none`}
            style={{ minHeight: 180 }}
            onMouseDown={handleEatablesMouseDown}
            onMouseLeave={handleEatablesMouseLeave}
            onMouseUp={handleEatablesMouseUp}
            onMouseMove={handleEatablesMouseMove}
          >
            {eatables
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              )
              .sort((a, b) => {
                if (Number(a.stock) === 0 && Number(b.stock) !== 0) return 1;
                if (Number(a.stock) !== 0 && Number(b.stock) === 0) return -1;
                return 0;
              })
              .filter((item) => !outOfStockOnly || Number(item.stock) === 0)
              .map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("application/json", JSON.stringify(item));
                  }}
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
                    <div className="text-sm text-gray-300 mt-2 flex flex-col items-start">
                      <span>Stock: <span className="font-bold">{item.stock}</span></span>
                      <span className="font-bold">{Number(item.sell_price).toFixed(2)} DA</span>
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
            ref={drinkablesScrollRef}
            className={`grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-x-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ${isDrinkablesDown ? "cursor-grabbing" : "cursor-grab"} select-none`}
            style={{ minHeight: 180 }}
            onMouseDown={handleDrinkablesMouseDown}
            onMouseLeave={handleDrinkablesMouseLeave}
            onMouseUp={handleDrinkablesMouseUp}
            onMouseMove={handleDrinkablesMouseMove}
          >
            {drinkables
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              )
              .sort((a, b) => {
                if (Number(a.stock) === 0 && Number(b.stock) !== 0) return 1;
                if (Number(a.stock) !== 0 && Number(b.stock) === 0) return -1;
                return 0;
              })
              .filter((item) => !outOfStockOnly || Number(item.stock) === 0)
              .map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("application/json", JSON.stringify(item));
                  }}
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
                    <div className="text-sm text-gray-300 mt-2 flex flex-col items-start">
                      <span>Stock: <span className="font-bold">{item.stock}</span></span>
                      <span className="font-bold">{Number(item.sell_price).toFixed(2)} DA</span>
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
      {/* <button
        className="fixed bottom-8 right-8 bg-purple-700 hover:bg-purple-800 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 md:hidden"
        onClick={() => setShowAddModal(true)}
        title="Add Consumable"
      >
        <Plus className="w-7 h-7" />
      </button> */}

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
            <div className="mb-3">
              <label className="block mb-1 text-white">Sell Price (DA)</label>
              <input
                type="number"
                min={0}
                value={addSellPrice}
                onChange={(e) => setAddSellPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-white">Barcode</label>
              <input
                ref={addBarcodeInputRef}
                type="text"
                value={addBarcode}
                onChange={(e) => setAddBarcode(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter barcode"
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
                onClick={() => { handleAdd(); playSound(); }}
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
                onClick={() => { handleSell(); playSound(); }}
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
              <label className="block mb-1 text-white">Unit Price</label>
              <input
                type="number"
                value={editUnitPrice}
                onChange={(e) => setEditUnitPrice(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-white">Total Cost : {editStock * editUnitPrice} DA</label>
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
  </div>
    </>
  );
}

export default ConsumationPage;