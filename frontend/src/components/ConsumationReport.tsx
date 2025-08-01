import { useState, useMemo, Fragment, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { useConsumation } from "../context/ConsumationContext";
import { Dialog, Transition,TransitionChild } from "@headlessui/react";
import { FunnelIcon, ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { ScanEye ,Expand } from "lucide-react";

const COLORS = ["#6366f1", "#22d3ee", "#facc15", "#f472b6", "#34d399", "#f87171"];

type SaleItem = {
  type: string;
  name: string;
  amount: number | string;
  sell_price: number | string;
  unit_price?: number | string;
};

type SaleGroup = {
  created_at: string;
  items: SaleItem[];
  sale_id: number | string;
};

interface SaleLogCardProps {
  saleGroup: SaleGroup;
  saleIdx: number;
}

export default function ConsumationReport({ onBack }: { onBack: () => void }) {
  const { sales, stockMoves, revenue, profit } = useConsumation();
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchSales, setSearchSales] = useState("");
  const [searchMoves, setSearchMoves] = useState("");
  const [salesPage, setSalesPage] = useState(0);
  const [showAllSales] = useState(false);

  // Stock movement expand/collapse state
  const [stockExpanded, setStockExpanded] = useState(false);

  // Ref and handlers for horizontal scroll in stock movement
  const movesScrollRef = useRef<HTMLDivElement | null>(null);
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const handleMouseDownMoves = (e: React.MouseEvent<HTMLDivElement>) => {
    isDown = true;
    startX = e.pageX - (movesScrollRef.current?.offsetLeft || 0);
    scrollLeft = movesScrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeaveMoves = () => {
    isDown = false;
  };

  const handleMouseUpMoves = () => {
    isDown = false;
  };

  const handleMouseMoveMoves = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - (movesScrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // scroll-fast
    if (movesScrollRef.current) {
      movesScrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Chart modal state
  const [chartModal, setChartModal] = useState<{ open: boolean; chart: 'revenue' | 'type' | 'stock' | null }>({ open: false, chart: null });

  // Chart modal content
  const renderChartModal = () => {
    if (!chartModal.open) return null;
    return (
      <Transition.Root show={chartModal.open} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={() => setChartModal({ open: false, chart: null })}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="relative z-50 w-full max-w-3xl mx-auto p-6">
            <Dialog.Panel className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl flex flex-col gap-4">
              <Dialog.Title className="text-lg font-bold text-white mb-2 flex justify-between items-center">
                {chartModal.chart === 'revenue' && 'Revenue by Day'}
                {chartModal.chart === 'type' && 'Sales by Type'}
                {chartModal.chart === 'stock' && 'Stock by Day'}
                <button onClick={() => setChartModal({ open: false, chart: null })} className="ml-4 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600">Close</button>
              </Dialog.Title>
              <div className="w-full h-[400px]">
                {chartModal.chart === 'revenue' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#cbd5e1" fontSize={14} />
                      <YAxis stroke="#cbd5e1" fontSize={14} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="profit" fill="#22d3ee" name="Profit" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartModal.chart === 'type' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                        {salesByType.map((_, index) => (
                          <Cell key={`cell-modal-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {chartModal.chart === 'stock' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#cbd5e1" fontSize={14} />
                      <YAxis stroke="#cbd5e1" fontSize={14} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Bar dataKey="stock" fill="#facc15" name="Stock" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition.Root>
    );
  };

  // Filtering and search logic
  const filteredSales = useMemo(() => sales.filter(sale => {
    const matchesType = !type || sale.type === type;
    const matchesFrom = !dateFrom || sale.created_at >= dateFrom;
    const matchesTo = !dateTo || sale.created_at <= dateTo + " 23:59:59";
    const matchesSearch = !searchSales || sale.name.toLowerCase().includes(searchSales.toLowerCase());
    return matchesType && matchesFrom && matchesTo && matchesSearch;
  }), [sales, type, dateFrom, dateTo, searchSales]);

  const filteredStockMoves = useMemo(() => stockMoves.filter(move => {
    const matchesType = !type || move.type === type;
    const matchesFrom = !dateFrom || move.date >= dateFrom;
    const matchesTo = !dateTo || move.date <= dateTo + " 23:59:59";
    const matchesSearch = !searchMoves || move.name.toLowerCase().includes(searchMoves.toLowerCase());
    return matchesType && matchesFrom && matchesTo && matchesSearch;
  }), [stockMoves, type, dateFrom, dateTo, searchMoves]);

  // Charts and log grouping
  // Group sales by sale_id for log/timeline view
  const salesLog = useMemo(() => {
    const grouped: Record<string, { created_at: string, items: typeof sales, sale_id: number|string }> = {};
    filteredSales.forEach(sale => {
      if (!grouped[sale.sale_id]) grouped[sale.sale_id] = { created_at: sale.created_at, items: [], sale_id: sale.sale_id };
      grouped[sale.sale_id].items.push(sale);
    });
    // Sort by created_at desc
    return Object.values(grouped).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [filteredSales]);

  // Pagination for sales log
  const SALES_PER_PAGE = 5;
  const pagedSalesLog = useMemo(() => {
    if (showAllSales) return salesLog;
    const start = salesPage * SALES_PER_PAGE;
    return salesLog.slice(start, start + SALES_PER_PAGE);
  }, [salesLog, salesPage, showAllSales]);

  // Stock by Day graph
  const stockByDay = useMemo(() => {
    const acc: Record<string, { date: string; stock: number }> = {};
    let runningStock: Record<string, number> = {};
    filteredStockMoves.slice().reverse().forEach(move => {
      const day = move.date.split(" ")[0];
      if (!acc[day]) acc[day] = { date: day, stock: 0 };
      if (!runningStock[move.name]) runningStock[move.name] = 0;
      runningStock[move.name] += move.change;
      acc[day].stock += move.change;
    });
    // Convert to array and accumulate for each day
    let total = 0;
    return Object.values(acc).sort((a, b) => a.date.localeCompare(b.date)).map(d => {
      total += d.stock;
      return { date: d.date, stock: total };
    });
  }, [filteredStockMoves]);

  // Revenue/profit by day for chart
  const salesByDay = useMemo(() => {
    const acc: Record<string, { date: string; revenue: number; profit: number }> = {};

    filteredSales.forEach(sale => {
      const rawDate = sale.created_at;
      const dayKey = rawDate.split(" ")[0]; // still used for grouping
      const formattedDate = new Date(rawDate).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      if (!acc[dayKey]) {
        acc[dayKey] = { date: formattedDate, revenue: 0, profit: 0 };
      }

      acc[dayKey].revenue += revenue;
      acc[dayKey].profit += profit;
    });

    return Object.values(acc);
  }, [filteredSales]);


  // Sales by type for chart
  const salesByType = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredSales.forEach(sale => {
      if (!acc[sale.type]) acc[sale.type] = 0;
      acc[sale.type] += Number(sale.amount) * Number(sale.sell_price);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Grouping for horizontal scroll
  const rows = 3;
  const salesGroups = [];
  const salesToShow = filteredSales.slice(0, 69);
  for (let i = 0; i < salesToShow.length; i += rows) {
    salesGroups.push(salesToShow.slice(i, i + rows));
  }
  const moveGroups = [];
  const movesToShow = filteredStockMoves.slice(0, 69);
  for (let i = 0; i < movesToShow.length; i += rows) {
    moveGroups.push(movesToShow.slice(i, i + rows));
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 bg-gray-800/60 backdrop-blur-xl rounded-2xl p-0 border border-gray-700 shadow-2xl overflow-hidden">
      {renderChartModal()}
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-gray-900/90 via-blue-900/80 to-gray-900/90 px-8 py-6 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow transition"
            title="Back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight ml-2">Consumables Report</h2>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search sales..."
            value={searchSales}
            onChange={e => { setSearchSales(e.target.value); setSalesPage(0); }}
            className="px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            style={{ minWidth: 120 }}
          />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchMoves}
            onChange={e => setSearchMoves(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            style={{ minWidth: 120 }}
          />
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Dialog */}
      <Transition.Root show={filterOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setFilterOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="scale-95 opacity-0" enterTo="scale-100 opacity-100"
              leave="ease-in duration-150" leaveFrom="scale-100 opacity-100" leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl flex flex-col gap-6">
                <Dialog.Title className="text-lg font-bold text-white mb-2">Filters</Dialog.Title>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1 text-gray-300">
                    Type
                    <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
                      <option value="">All Types</option>
                      <option value="eatable">Eatable</option>
                      <option value="drinkable">Drinkable</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-gray-300">
                    Date From
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
                  </label>
                  <label className="flex flex-col gap-1 text-gray-300">
                    Date To
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
                  </label>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg shadow"
                  >Apply</button>
                  <button
                    onClick={() => { setType(""); setDateFrom(""); setDateTo(""); setFilterOpen(false); }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
                  >Reset</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-8">
        <div className="bg-gradient-to-tr from-green-900/60 to-green-700/40 rounded-xl p-6 border border-green-800 flex flex-col items-center shadow-lg">
          <div className="text-sm text-green-200">Revenue</div>
          <div className="text-3xl font-bold text-green-400 mt-1">{revenue.toFixed(2)} <span className="text-base font-medium">DA</span></div>
        </div>
        <div className="bg-gradient-to-tr from-blue-900/60 to-blue-700/40 rounded-xl p-6 border border-blue-800 flex flex-col items-center shadow-lg">
          <div className="text-sm text-blue-200">Profit</div>
          <div className="text-3xl font-bold text-blue-400 mt-1">{profit.toFixed(2)} <span className="text-base font-medium">DA</span></div>
        </div>
        <div className="bg-gradient-to-tr from-yellow-900/60 to-yellow-700/40 rounded-xl p-6 border border-yellow-800 flex flex-col items-center shadow-lg">
          <div className="text-sm text-yellow-200">Total Sales</div>
          <div className="text-3xl font-bold text-yellow-400 mt-1">{filteredSales.length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-8 ">
        {/* Revenue by Day Chart */}
        <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-800 shadow flex flex-col relative">
          <h3 className="text-white text-lg font-semibold mb-2">Revenue by Day</h3>
          <button
            className="absolute top-4 right-4 px-2 py-1 text-xs hover:bg-blue-800 text-white rounded"
            onClick={() => setChartModal({ open: true, chart: 'revenue' })}
          > <ScanEye/></button>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#cbd5e1" fontSize={12} />
              <YAxis stroke="#cbd5e1" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="#22d3ee" name="Profit" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Sales by Type Chart */}
        <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-800 shadow flex flex-col relative">
          <h3 className="text-white text-lg font-semibold mb-2">Sales by Type</h3>
          <button
            className="absolute top-4 right-4 px-2 py-1 text-xs hover:bg-blue-800 text-white rounded"
            onClick={() => setChartModal({ open: true, chart: 'type' })}
          ><ScanEye/></button>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={salesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {salesByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Stock by Day Chart */}
        <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-800 shadow flex flex-col relative">
          <h3 className="text-white text-lg font-semibold mb-2">Stock by Day</h3>
          <button
            className="absolute top-4 right-4 px-2 py-1 text-xs hover:bg-blue-800 text-white rounded"
            onClick={() => setChartModal({ open: true, chart: 'stock' })}
          ><ScanEye /></button>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#cbd5e1" fontSize={12} />
              <YAxis stroke="#cbd5e1" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="stock" fill="#facc15" name="Stock" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Log Timeline with Pagination and Extend per Sale */}
      <div className="px-8 py-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Sales Log</h3>
        <div className="flex flex-col gap-6">
          {pagedSalesLog.length === 0 && (
            <div className="text-gray-400 text-center py-8 bg-transparent rounded-xl col-span-3 min-w-[320px]">
              No sales found for this filter.
            </div>
          )}
          {pagedSalesLog.map((saleGroup, idx) => (
            <SaleLogCard key={idx} saleGroup={saleGroup} saleIdx={salesPage * SALES_PER_PAGE + idx} />
          ))}
        </div>
        {/* Pagination Controls */}
        {salesLog.length > SALES_PER_PAGE && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
              onClick={() => setSalesPage(p => Math.max(0, p - 1))}
              disabled={salesPage === 0}
            >Prev</button>
            <span className="text-gray-300">Page {salesPage + 1} / {Math.ceil(salesLog.length / SALES_PER_PAGE)}</span>
            <button
              className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
              onClick={() => setSalesPage(p => Math.min(Math.ceil(salesLog.length / SALES_PER_PAGE) - 1, p + 1))}
              disabled={salesPage >= Math.ceil(salesLog.length / SALES_PER_PAGE) - 1}
            >Next</button>
          </div>

        )}
      </div>

      {/* Stock Movement Collapsible */}
      <div className="px-8 py-8">
        <div className="flex items-center mb-4">
          <h3 className="text-xl font-semibold text-white flex-1">Stock Movement</h3>
          <button
            className="flex items-center gap-1 px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 text-sm"
            onClick={() => setStockExpanded(v => !v)}
            title={stockExpanded ? 'Collapse' : 'Expand'}
          >
            {stockExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            {stockExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {stockExpanded && (
          <div
            ref={movesScrollRef}
            className="flex overflow-x-auto gap-4 pb-4 cursor-grab"
            style={{ userSelect: "none" }}
            onMouseDown={handleMouseDownMoves}
            onMouseLeave={handleMouseLeaveMoves}
            onMouseUp={handleMouseUpMoves}
            onMouseMove={handleMouseMoveMoves}
          >
            {moveGroups.length === 0 && (
              <div className="text-gray-400 text-center py-8 bg-transparent rounded-xl col-span-3 min-w-[320px]">
                No stock moves found for this filter.
              </div>
            )}
            {moveGroups.slice(0, 5).map((group, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4 min-w-[320px]">
                {group.map((m, i) => (
                  <div key={i} className="bg-gradient-to-tr from-blue-900/60 to-blue-700/40 rounded-xl p-6 border border-blue-800 shadow flex flex-col gap-2 border-l-4 border-blue-400">
                    <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-mono">
                      {new Date(m.date).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${m.type === "eatable" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                        {m.type}
                      </span>
                    </div>
                    <div className="font-bold text-lg text-white">{m.name}</div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className={`font-semibold ${m.change < 0 ? "text-red-400" : "text-green-400"}`}>
                        {m.change > 0 ? "+" : ""}{m.change} units
                      </span>
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-200">{m.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
function SaleLogCard({ saleGroup, saleIdx }: SaleLogCardProps) {
  const [open, setOpen] = useState(false);
  const showExtend = saleGroup.items.length > 4;
  const saleId = saleGroup.sale_id || saleIdx + 1;
  return (
    <div className="bg-gradient-to-tr from-blue-900/60 to-blue-700/40 rounded-xl p-6 border border-blue-800 shadow flex flex-col gap-2 border-l-4 border-blue-400">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400 font-mono">
          {new Date(saleGroup.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
        <span className="text-xs text-gray-300">Sale #{saleId}</span>
      </div>
      <div className="flex flex-col gap-2">
        {(showExtend ? saleGroup.items.slice(0, 4) : saleGroup.items).map((item: SaleItem, i: number) => (
          <div key={i} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border-b border-blue-800 pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${item.type === "eatable" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>{item.type}</span>
              <span className="font-bold text-white">{item.name}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-300">
              <span>Amount: <span className="font-semibold text-white">{item.amount}</span></span>
              <span>Sell: <span className="font-semibold text-white">{item.sell_price} DA</span></span>
              <span>Profit: <span className="font-semibold text-green-400">{((Number(item.sell_price) - Number(item.unit_price || 0)) * Number(item.amount)).toFixed(2)} DA</span></span>
            </div>
          </div>
        ))}
        {showExtend && (
          <button
            className="self-center mt-2 px-4 py-1 rounded text-white text-xs hover:bg-blue-800"
            onClick={() => setOpen(true)}
          >
          <Expand />
          </button>
        )}
      </div>
      {/* Modal for all items in this sale */}
      {open && (
        <Transition show={open} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={() => setOpen(false)}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </TransitionChild>
            <div className="relative z-50 w-full max-w-lg mx-auto p-6">
              <DialogPanel className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl flex flex-col gap-4">
                <DialogTitle className="text-lg font-bold text-white mb-2 flex justify-between items-center">
                  Sale #{saleId} Items
                  <button onClick={() => setOpen(false)} className="ml-4 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600">Close</button>
                </DialogTitle>
                <div className="flex flex-col gap-2">
                  {saleGroup.items.map((item: SaleItem, i: number) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border-b border-blue-800 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.type === "eatable" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>{item.type}</span>
                        <span className="font-bold text-white">{item.name}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-300">
                        <span>Amount: <span className="font-semibold text-white">{item.amount}</span></span>
                        <span>Sell: <span className="font-semibold text-white">{item.sell_price} DA</span></span>
                        <span>Profit: <span className="font-semibold text-green-400">{((Number(item.sell_price) - Number(item.unit_price || 0)) * Number(item.amount)).toFixed(2)} DA</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </Transition>
      )}
    </div>
  );
}