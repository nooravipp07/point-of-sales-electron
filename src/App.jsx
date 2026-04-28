import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  User,
  ChevronRight,
  CheckCircle2,
  X,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Mock Data ---
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Ribeye Steak', price: 24.99, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=300', stock: 45.5 },
  { id: 2, name: 'Chicken Breast', price: 12.50, unit: 'kg', category: 'Poultry', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 30.0 },
  { id: 3, name: 'Lamb Chops', price: 18.00, unit: 'kg', category: 'Lamb', image: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=300', stock: 15.2 },
  { id: 4, name: 'Ground Beef', price: 9.99, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=300', stock: 60.0 },
  { id: 5, name: 'Pork Belly', price: 14.20, unit: 'kg', category: 'Pork', image: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=300', stock: 22.8 },
  { id: 6, name: 'Artisan Sausages', price: 8.50, unit: 'pack', category: 'Processed', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300', stock: 40 },
];

// --- Components ---

const SidebarItem = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-black text-white shadow-lg shadow-black/20' 
        : 'text-gray-400 hover:bg-gray-100 hover:text-black'
    }`}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="absolute left-16 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </button>
);

const ProductCard = ({ product, onAdd }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    onClick={() => onAdd(product)}
    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer group"
  >
    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-50">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
        {product.unit}
      </div>
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
    <div className="flex items-center justify-between">
      <span className="text-lg font-bold text-black">${product.price.toFixed(2)}</span>
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
        <Plus size={16} />
      </div>
    </div>
  </motion.div>
);

const CartItem = ({ item, onUpdate, onRemove, onSetQuantity }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
  >
    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
      <p className="text-xs text-gray-500">${item.price.toFixed(2)} / {item.unit}</p>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        <button 
          onClick={() => onUpdate(item.id, -0.1)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Minus size={14} />
        </button>
        <input 
          type="number"
          step="0.1"
          value={item.quantity}
          onChange={(e) => onSetQuantity(item.id, e.target.value)}
          className="w-12 text-center text-sm font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button 
          onClick={() => onUpdate(item.id, 0.1)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <button 
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    return {
        subtotal,
        tax,
        total: subtotal + tax
    };
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + (product.unit === 'kg' ? 0.5 : 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.unit === 'kg' ? 0.5 : 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0.1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setQuantity = (id, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, numValue) };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    
    // Simulate processing
    setTimeout(() => {
      const newSale = {
        id: `ORD-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleString(),
        items: [...cart],
        total: totals.total
      };
      
      setSalesHistory([newSale, ...salesHistory]);
      setCart([]);
      setIsCheckingOut(false);
      alert('Order completed successfully!');
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#FBFBFB] text-black font-sans selection:bg-black selection:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center py-8 border-r border-gray-100 bg-white">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-12 shadow-xl shadow-black/20">
          B
        </div>
        <nav className="flex-1 flex flex-col gap-6">
          <SidebarItem 
            active={activeTab === 'pos'} 
            icon={LayoutDashboard} 
            label="POS" 
            onClick={() => setActiveTab('pos')} 
          />
          <SidebarItem 
            active={activeTab === 'inventory'} 
            icon={Package} 
            label="Inventory" 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            active={activeTab === 'history'} 
            icon={History} 
            label="Sales" 
            onClick={() => setActiveTab('history')} 
          />
          <SidebarItem 
            active={activeTab === 'settings'} 
            icon={Settings} 
            label="Settings" 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
        <div className="mt-auto">
          <SidebarItem icon={User} label="Profile" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pos' && (
          <>
            {/* Product Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Butcher POS</h1>
                    <p className="text-gray-500">Welcome back, Noor</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-all w-80">
                      <Search size={18} className="text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search cuts, categories..." 
                        className="bg-transparent outline-none w-full text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['All', 'Beef', 'Poultry', 'Lamb', 'Pork', 'Processed'].map(cat => (
                    <button 
                      key={cat}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 pt-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Panel */}
            <div className="w-[400px] bg-white border-l border-gray-100 flex flex-col shadow-2xl shadow-black/5">
              <div className="p-8 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Current Order
                  </h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    #ORD-8291
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                <AnimatePresence mode="popLayout">
                  {cart.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart size={32} className="text-gray-300" />
                      </div>
                      <h3 className="font-bold text-gray-900">Your cart is empty</h3>
                      <p className="text-sm text-gray-500 mt-1">Add some fresh cuts to start an order</p>
                    </motion.div>
                  ) : (
                    cart.map(item => (
                      <CartItem 
                        key={item.id} 
                        item={item} 
                        onUpdate={updateQuantity} 
                        onRemove={removeFromCart} 
                        onSetQuantity={setQuantity}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax (5%)</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  disabled={cart.length === 0 || isCheckingOut}
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Complete Order <ChevronRight size={20} /></>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="flex-1 p-12 overflow-y-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
                <p className="text-gray-500 mt-2">Manage your stock levels and pricing</p>
              </div>
              <button className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 hover:bg-zinc-800 transition-all">
                <Plus size={20} /> Add New Product
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 font-bold text-sm text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-8 py-5 font-bold text-sm text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-5 font-bold text-sm text-gray-400 uppercase tracking-wider">Stock</th>
                    <th className="px-8 py-5 font-bold text-sm text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-8 py-5 font-bold text-sm text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${product.stock < 20 ? 'text-red-500' : 'text-gray-900'}`}>
                            {product.stock} {product.unit}
                          </span>
                          {product.stock < 20 && (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Low Stock</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-gray-300 hover:text-black transition-colors">
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 p-12 overflow-y-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-12">Sales History</h1>
            
            <div className="space-y-6">
              {salesHistory.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No sales yet</h3>
                  <p className="text-gray-500 mt-2">Complete your first order to see it here</p>
                </div>
              ) : (
                salesHistory.map(sale => (
                  <div key={sale.id} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold">{sale.id}</h3>
                          <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{sale.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total Amount</p>
                        <p className="text-2xl font-bold">${sale.total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      {sale.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-bold">{item.quantity}{item.unit}</span>
                          <span className="text-sm text-gray-500">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
