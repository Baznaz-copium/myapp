import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

const API_URL = 'http://myapp.test/backend/api/Consumation.php';

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export default function ConsumationReport({ onBack }: { onBack: () => void }) {
  type Sale = {
    unit_price: number;
    created_at: string;
    name: string;
    type: string;
    amount: number;
    sell_price: number;
  };
  const [sales, setSales] = useState<Sale[]>([]);
  type StockMove = {
    date: string;
    name: string;
    type: string;
    change: number;
    reason: string;
  };
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState({ revenue: 0, profit: 0 });

  useEffect(() => {
    fetch(`${API_URL}?action=report&type=${type}&from=${dateFrom}&to=${dateTo}`)
      .then(r => r.json())
      .then((data: any) => {
        setSales(data.sales || []);
        setStockMoves(data.stock_moves || []);
        setSummary({ revenue: data.revenue || 0, profit: data.profit || 0 });
      });
  }, [type, dateFrom, dateTo]);

  // Prepare data for charts
const salesByDay = sales.reduce((acc, sale) => {
  const day = sale.created_at.split(" ")[0];
  if (!acc[day]) acc[day] = { date: day, revenue: 0, profit: 0 };
  acc[day].revenue += sale.amount * sale.sell_price; // total revenue
  acc[day].profit += (sale.sell_price - sale.unit_price) * sale.amount; // profit = (sell - unit) * amount
  return acc;
}, {} as Record<string, { date: string; revenue: number; profit: number }>);

  const salesByType = sales.reduce((acc, sale) => {
    if (!acc[sale.type]) acc[sale.type] = 0;
    acc[sale.type] += sale.amount * sale.sell_price;
    return acc;
  }, {} as Record<string, number>);

  const salesByDayArr = Object.values(salesByDay);

  const pieData = Object.entries(salesByType).map(([key, value]) => ({
    name: key,
    value,
  }));

  const salesToShow = sales.slice(0, 69); // show up to 69
  const rows = 3;
  const groups = [];
  for (let i = 0; i < salesToShow.length; i += rows) {
    groups.push(salesToShow.slice(i, i + rows));
  }

  const salesScrollRef = useRef<HTMLDivElement>(null);
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown = true;
    startX = e.pageX - (salesScrollRef.current?.offsetLeft || 0);
    scrollLeft = salesScrollRef.current?.scrollLeft || 0;
  };
  const handleMouseLeave = () => { isDown = false; };
  const handleMouseUp = () => { isDown = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - (salesScrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // scroll speed
    if (salesScrollRef.current) salesScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const stockMovesToShow = stockMoves.slice(0, 69); // show up to 69
  const moveGroups = [];
  for (let i = 0; i < stockMovesToShow.length; i += rows) {
    moveGroups.push(stockMovesToShow.slice(i, i + rows));
  }

  const movesScrollRef = useRef<HTMLDivElement>(null);
  let isDownMoves = false;
  let startXMoves = 0;
  let scrollLeftMoves = 0;

  const handleMouseDownMoves = (e: React.MouseEvent) => {
    isDownMoves = true;
    startXMoves = e.pageX - (movesScrollRef.current?.offsetLeft || 0);
    scrollLeftMoves = movesScrollRef.current?.scrollLeft || 0;
  };
  const handleMouseLeaveMoves = () => { isDownMoves = false; };
  const handleMouseUpMoves = () => { isDownMoves = false; };
  const handleMouseMoveMoves = (e: React.MouseEvent) => {
    if (!isDownMoves) return;
    e.preventDefault();
    const x = e.pageX - (movesScrollRef.current?.offsetLeft || 0);
    const walk = (x - startXMoves) * 1.5;
    if (movesScrollRef.current) movesScrollRef.current.scrollLeft = scrollLeftMoves - walk;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-white">Consumables Report</h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded-lg"
        >
          Back to Management
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 flex items-center gap-2">
          <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
            <option value="">All Types</option>
            <option value="eatable">Eatable</option>
            <option value="drinkable">Drinkable</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow">
          <div className="text-sm text-gray-400">Revenue</div>
          <div className="text-2xl font-bold text-green-700">{summary.revenue} DA</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow">
          <div className="text-sm text-gray-400">Profit</div>
          <div className="text-2xl font-bold text-blue-700">{summary.profit} DA</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow">
          <div className="text-sm text-gray-400">Total Sales</div>
          <div className="text-2xl font-bold text-yellow-700">{sales.length}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-white text-lg font-semibold mb-2">Revenue by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDayArr}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-white text-lg font-semibold mb-2">Sales by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Sales History */}
      <h3 className="text-xl font-semibold mb-4 text-white">Sales History</h3>
      <div
        ref={salesScrollRef}
        className="flex overflow-x-auto gap-4 pb-4 cursor-grab"
        style={{ userSelect: "none" }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {groups.map((group, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-4 min-w-[320px]">
            {group.map((s, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow flex flex-col gap-2 border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{s.created_at}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${s.type === "eatable" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                    {s.type}
                  </span>
                </div>
                <div className="font-bold text-lg text-white">{s.name}</div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Amount: <span className="font-semibold text-white">{s.amount}</span></span>
                  <span>Sell Price: <span className="font-semibold text-white">{s.sell_price} DA</span></span>
                </div>
                <div className="text-right text-green-400 font-bold text-lg">
                  +{s.amount * s.sell_price} DA
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Stock Movement */}
      <h3 className="text-xl font-semibold mb-4 text-white">Stock Movement</h3>
      <div
        ref={movesScrollRef}
        className="flex overflow-x-auto gap-4 pb-4 cursor-grab"
        style={{ userSelect: "none" }}
        onMouseDown={handleMouseDownMoves}
        onMouseLeave={handleMouseLeaveMoves}
        onMouseUp={handleMouseUpMoves}
        onMouseMove={handleMouseMoveMoves}
      >
        {moveGroups.map((group, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-4 min-w-[320px]">
            {group.map((m, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow flex flex-col gap-2 border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{m.date}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${m.type === "eatable" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                    {m.type}
                  </span>
                </div>
                <div className="font-bold text-lg text-white">{m.name}</div>
                <div className="flex justify-between text-sm mt-1">
                  <span className={`font-semibold ${m.change < 0 ? "text-red-400" : "text-green-400"}`}>
                    {m.change > 0 ? "+" : ""}{m.change}{" "}units
                  </span>  
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-200">{m.reason}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}