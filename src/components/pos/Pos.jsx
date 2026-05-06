import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
    addToCart,
    updateQuantity,
    setQuantity,
    removeFromCart,
    setPaymentMethod,
    clearCart,
    setCustomer,
    setBranch,
    setButcher,
} from '../../store/slices/cartSlice';
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
    Scale,
    MapPin, 
    Wallet, 
    ChevronDown, 
    Users,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber, mround } from '../../utils/formatNumber';
import { usePrint } from '../../hooks/usePrint';
import CheckoutModal from './CheckoutModal';
import PrinterSettings from '../PrinterSettings';

// --- Mock Data ---
const INITIAL_PRODUCTS = [
	{ id: 1, name: 'KARKAS', price: 32000, discount: 3000, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 45.5 },
	{ id: 2, name: 'DADA', price: 32000, discount: 3000, unit: 'kg', category: 'Poultry', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 30.0 },
	{ id: 3, name: 'PAHA', price: 32000, discount: 3000, unit: 'kg', category: 'Lamb', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 15.2 },
	{ id: 4, name: 'PAHA ATAS', price: 32000, discount: 3000, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 60.0 },
	{ id: 5, name: 'PAHA PENTUL', price: 34000, discount: 3000, unit: 'kg', category: 'Pork', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 22.8 },
	{ id: 6, name: 'SAYAP', price: 33000, discount: 0, unit: 'kg', category: 'Processed', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 40 },
	{ id: 7, name: 'KULIT', price: 30000, discount: 0, unit: 'kg', category: 'Dairy', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 25.0 },
	{ id: 8, name: 'TULANG RONGKONG', price: 12000, discount: 0, unit: 'kg', category: 'Dairy', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 35.0 },
	{ id: 9, name: 'KARKAS TG', price: 35000, discount: 0, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 45.5 },
	{ id: 10, name: 'TULANG RAWAN', price: 50000, discount: 0, unit: 'kg', category: 'Poultry', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 30.0 },
	{ id: 11, name: 'TULANG PAHA', price: 10000, discount: 0, unit: 'kg', category: 'Lamb', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 15.2 },
	{ id: 12, name: 'TETELAN', price: 21000, discount: 0, unit: 'kg', category: 'Beef', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 60.0 },
	{ id: 13, name: 'FILLET DADA KULIT', price: 42000, discount: 0, unit: 'kg', category: 'Pork', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 22.8 },
	{ id: 14, name: 'FILLET DADA BERSIH', price: 44000, discount: 0, unit: 'kg', category: 'Processed', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 40 },
	{ id: 15, name: 'FILLET PAHA KULIT', price: 42000, discount: 0, unit: 'kg', category: 'Dairy', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 25.0 },
	{ id: 16, name: 'FILLET PAHA BERSIH', price: 44000, discount: 0, unit: 'kg', category: 'Dairy', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 35.0 },
	{ id: 17, name: 'DAGING AYAM GILING', price: 48000, discount: 0, unit: 'kg', category: 'Dairy', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=300', stock: 35.0 },
];

const customers = ['Walk-in Customer', 'Budi Santoso', 'Siti Rahma', 'Ahmad Fauzi'];
const branches = ['Main Branch', 'Branch Sudirman', 'Branch Kemang', 'Branch BSD'];
const butheries = ['Rizal', 'Reza', 'Hendri'];

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
			<span className="text-lg font-bold text-black">{formatNumber(product.price)}</span>
			<div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
				<Plus size={16} />
			</div>
		</div>
		<div className="flex items-center justify-between">
			<span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">Discount {formatNumber(product.discount)} / Kg</span>
		</div>
	</motion.div>
);

const CartItem = ({ item, onUpdate, onRemove, onSetQuantity }) => {
  const gross    = mround(item.price * item.quantity);
  //const discount = mround(item.discount * item.quantity);
  const discount = item.discount;
  const nett     = gross - discount;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-2 p-3 rounded-2xl hover:bg-gray-50 bg-emerald-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
          <p className="text-xs text-gray-500">{formatNumber(item.price)} / {item.unit}</p>
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
      </div>

      {/* Price breakdown */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Gross</span>
          <span>{formatNumber(gross)}</span>
        </div>
        <div className="flex justify-between text-xs text-emerald-600">
            <span>Discount</span>
            <span>- {formatNumber(discount)}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-gray-900 border-t border-gray-100 pt-0.5">
          <span>Nett</span>
          <span>{formatNumber(nett)}</span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---
export default function Pos() {
	const { printReceipt } = usePrint();
	const reduxDispatch = useDispatch();
	const user = useSelector((state) => state.auth.user);
	const cart = useSelector((state) => state.cart.items);
	const customer = useSelector((state) => state.cart.customer);
	const branch = useSelector((state) => state.cart.branch);
	const butcher = useSelector((state) => state.cart.butcher);

	const [activeTab, setActiveTab] = useState('pos');
	const [products, setProducts] = useState(INITIAL_PRODUCTS);
	const [searchQuery, setSearchQuery] = useState('');
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [salesHistory, setSalesHistory] = useState([]);
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);

	const totalCash = 4750000;
	const searchRef = useRef(null);

	useEffect(() => {
		const handleKeyDown = (e) => {
			const isTyping =
				["INPUT", "TEXTAREA"].includes(e.target.tagName) ||
				e.target.isContentEditable;

			if (isTyping) return;

			switch (e.key) {
				case "F1":
					e.preventDefault();
					searchRef.current?.focus();
					break;

				default:
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const filteredProducts = useMemo(() => {
		return products.filter(p => 
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.category.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [products, searchQuery]);

	const totals = useMemo(() => {
		const subtotal        = cart.reduce((sum, item) => sum + (mround(item.price * item.quantity)), 0);
		const totalDiscount   = cart.reduce((sum, item) => sum + item.discount, 0);
		const total           = subtotal - totalDiscount;
		return { subtotal, totalDiscount, total };
	}, [cart]);

	const handleAddToCart = (product) => {
		reduxDispatch(addToCart(product));
	};

	const handleUpdateQuantity = (id, delta) => {
		reduxDispatch(updateQuantity({ id, delta }));
	};

	const handleSetQuantity = (id, value) => {
		reduxDispatch(setQuantity({ id, quantity: value }));
	};

	const handleRemoveFromCart = (id) => {
		reduxDispatch(removeFromCart(id));
	};

	const handleCheckoutClick = () => {
		if (cart.length === 0) return;
		setShowCheckoutModal(true);
	};

	const handleConfirmCheckout = async (checkoutData) => {
		if (cart.length === 0) return;
		setIsCheckingOut(true);

		const receiptData = {
			storeName     : 'Priyadis POS',
			cashier       : user?.name || 'Cashier',
			customer      : customer   || 'Walk-in',
			branch        : branch     || '-',
			butcher       : butcher    || '-',
			paymentMethod : checkoutData.paymentMethod,
			orderMethod   : checkoutData.orderMethod,
			serviceMethod : checkoutData.serviceMethod,
			notes         : checkoutData.notes,
			cashReceived  : checkoutData.cashReceived,
			cashChange    : checkoutData.cashChange,
			date          : new Date().toLocaleString('id-ID'),
			items         : cart,
			subtotal      : totals.subtotal,
			totalDiscount : totals.totalDiscount,
			total         : totals.total,
		};

		try {
			const result = await printReceipt(receiptData);
			
			// Only proceed if print was successful (not cancelled)
			if (result && !result.cancelled) {
				const newSale = {
					id            : `ORD-${Math.floor(Math.random() * 10000)}`,
					date          : new Date().toLocaleString(),
					items         : [...cart],
					total         : totals.total,
					paymentMethod : checkoutData.paymentMethod,
					orderMethod   : checkoutData.orderMethod,
					serviceMethod : checkoutData.serviceMethod,
					notes         : checkoutData.notes,
					cashReceived  : checkoutData.cashReceived,
					cashChange    : checkoutData.cashChange,
				};

				setSalesHistory([newSale, ...salesHistory]);
				reduxDispatch(clearCart());
				setShowCheckoutModal(false);
			} else if (result?.cancelled) {
				// User cancelled print dialog
				console.log('Print dialog was cancelled');
			}
		} catch (err) {
			console.error('Checkout error:', err);
			alert('Print failed: ' + err);
		} finally {
			setIsCheckingOut(false);
		}
	};

	return (
		<div className="flex h-screen bg-[#FBFBFB] text-black font-sans selection:bg-black selection:text-white overflow-hidden">
			{/* Sidebar */}
			<aside className="w-20 flex flex-col items-center py-8 border-r border-gray-100 bg-white">
				<div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-12 shadow-xl shadow-black/20">P</div>
				<nav className="flex-1 flex flex-col gap-6">
					<SidebarItem 
						active={activeTab === 'pos'} 
						icon={LayoutDashboard} 
						label="POS" 
						onClick={() => setActiveTab('pos')} 
					/>
					<SidebarItem 
						active={activeTab === 'settings'} 
						icon={Settings} 
						label="Settings" 
						onClick={() => setActiveTab('settings')} 
					/>
				</nav>
				<div className="mt-auto">
					<SidebarItem 
                        icon={LogOut} 
                        label="Logout" 
                        onClick={() => reduxDispatch(logout())}
                    />
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex overflow-hidden">
				{activeTab === 'pos' && (
					<>
						{/* Product Grid */}
						<div className="flex-1 flex flex-col overflow-hidden">
							<header className="p-8 pb-4">
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl shadow-sm">
										<Wallet size={15} className="opacity-70" />
											<div>
												<p className="text-xs opacity-60 leading-none mb-1">Cash in Cashier</p>
												<p className="text-sm font-semibold leading-none">Rp {totalCash.toLocaleString('id-ID')}</p>
											</div>
									</div>

									{/* Right Controls */}
									<div className="flex items-center gap-3">
										{/* Butcheries Selectbox */}
										<div className="relative">
											<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
												<Users size={15} />
											</div>
											<select
												value={butcher}
												onChange={(e) => reduxDispatch(setButcher(e.target.value))}
												className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-700 cursor-pointer min-w-44"
											>
											<option value="">Select Butcheries</option>
											{butheries.map((c) => (
												<option key={c} value={c}>{c}</option>
											))}
											</select>
											<ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
										</div>

										{/* Customer Selectbox */}
										<div className="relative">
											<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
												<Users size={15} />
											</div>
											<select
												value={customer}
												onChange={(e) => reduxDispatch(setCustomer(e.target.value))}
												className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-700 cursor-pointer min-w-44"
											>
											<option value="">Select Customer</option>
											{customers.map((c) => (
												<option key={c} value={c}>{c}</option>
											))}
											</select>
											<ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
										</div>

										{/* Branch Selectbox */}
										<div className="relative">
											<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
												<MapPin size={15} />
											</div>
											<select
												value={branch}
												onChange={(e) => reduxDispatch(setBranch(e.target.value))}
												className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-700 cursor-pointer min-w-44"
											>
											<option value="">Select Store</option>
												{branches.map((b) => (
													<option key={b} value={b}>{b}</option>
												))}
											</select>
											<ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
										</div>
									</div>
								</div>
								
								<div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
									<div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-all w-80">
										<Search size={18} className="text-gray-400" />
										<input 
											ref={searchRef}
											type="text" 
											placeholder="Search" 
											className="bg-transparent outline-none w-full text-sm"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
									</div>
								</div>
							</header>

							<div className="flex-1 overflow-y-auto p-8 pt-4">
								<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
									{filteredProducts.map(product => (
										<ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
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
										#
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
												onUpdate={handleUpdateQuantity} 
												onRemove={handleRemoveFromCart} 
												onSetQuantity={handleSetQuantity}
											/>
                                        ))
                                    )}
								</AnimatePresence>
							</div>

							<div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between text-sm text-gray-500">
										<span>Subtotal</span>
										<span>{formatNumber(totals.subtotal)}</span>
									</div>
									<div className="flex justify-between text-sm text-gray-500">
										<span>Total Discount</span>
										<span>{formatNumber(totals.totalDiscount)}</span>
									</div>
									<div className="flex justify-between text-sm text-gray-500">
										<span>Ongkos Kirim</span>
										<span>0</span>
									</div>
									<div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
										<span>Total</span>
										<span>{formatNumber(totals.total)}</span>
									</div>
								</div>

								<button 
									disabled={cart.length === 0 || isCheckingOut}
									onClick={handleCheckoutClick}
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

				<CheckoutModal 
					isOpen={showCheckoutModal}
					cartItems={cart}
					totals={totals}
					onConfirm={handleConfirmCheckout}
					onCancel={() => setShowCheckoutModal(false)}
					isLoading={isCheckingOut}
				/>

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

				{activeTab === 'settings' && (
					<div className="flex-1 p-12 overflow-y-auto">
						<div className="flex justify-between items-end mb-12">
						<div>
							<h1 className="text-4xl font-bold tracking-tight">Settings</h1>
							<p className="text-gray-500 mt-2">Manage your settings</p>
						</div>
						</div>

						<PrinterSettings />
					</div>
				)}
			</main>
		</div>
	);
}
