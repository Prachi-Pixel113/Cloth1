import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cart Context
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = 'session_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sessionId', id);
    }
    return id;
  });

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart/${sessionId}`);
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, size, color, quantity = 1) => {
    try {
      await axios.post(`${API}/cart`, {
        product_id: productId,
        size: size,
        color: color,
        quantity: quantity,
        session_id: sessionId
      });
      fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await axios.put(`${API}/cart/${itemId}?quantity=${quantity}`);
      fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/session/${sessionId}`);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems,
      sessionId,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      cartTotal,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Myntra-style Header
const Header = ({ currentView, setCurrentView }) => {
  const { cartTotal } = useCart();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <h1 
              className="text-2xl font-bold text-pink-600 cursor-pointer"
              onClick={() => setCurrentView('home')}
            >
              StyleHub
            </h1>
          </div>

          {/* Main Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-12">
            <div className="relative group">
              <button 
                className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide py-2"
                onClick={() => setCurrentView('men')}
              >
                MEN
              </button>
              {/* Men's Dropdown Menu */}
              <div className="absolute top-full left-0 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white shadow-lg border-t-2 border-pink-600 mt-1 w-64 z-50">
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Shirts & T-Shirts</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Formal Shirts</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Jeans & Pants</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Ethnic Wear</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Blazers & Suits</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Activewear</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Footwear</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Accessories</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <button 
                className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide py-2"
                onClick={() => setCurrentView('women')}
              >
                WOMEN
              </button>
              {/* Women's Dropdown Menu */}
              <div className="absolute top-full left-0 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white shadow-lg border-t-2 border-pink-600 mt-1 w-64 z-50">
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Kurtas & Suits</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Sarees & Lehengas</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Dresses & Jumpsuits</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Tops & Tunics</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Jeans & Pants</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Activewear</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Footwear</a>
                    <a href="#" className="text-sm text-gray-700 hover:text-pink-600 py-1">Lingerie & Sleepwear</a>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('brands')}
            >
              BRANDS
            </button>
            
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('sale')}
            >
              SALE
            </button>
          </nav>

          {/* Search Bar */}
          <div className={`hidden md:flex items-center border-2 rounded-sm transition-colors ${
            isSearchFocused ? 'border-pink-500' : 'border-gray-200'
          }`}>
            <div className="flex items-center px-3 py-2 bg-gray-50">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for products, brands and more"
              className="px-3 py-2 w-80 text-sm bg-gray-50 focus:outline-none"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-6">
            {/* Profile */}
            <div className="hidden md:flex flex-col items-center cursor-pointer group">
              <svg className="w-5 h-5 text-gray-700 group-hover:text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-gray-700 group-hover:text-pink-600 font-medium">Profile</span>
            </div>

            {/* Wishlist */}
            <div className="hidden md:flex flex-col items-center cursor-pointer group">
              <svg className="w-5 h-5 text-gray-700 group-hover:text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs text-gray-700 group-hover:text-pink-600 font-medium">Wishlist</span>
            </div>

            {/* Bag */}
            <div 
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => setCurrentView('cart')}
            >
              <div className="relative">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11h8l1 9H7l1-9z" />
                </svg>
                {cartTotal > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {cartTotal}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 group-hover:text-pink-600 font-medium">Bag</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden px-4 pb-3">
          <div className="flex overflow-x-auto space-x-8 text-sm font-medium">
            <button className="text-gray-800 whitespace-nowrap font-bold" onClick={() => setCurrentView('men')}>MEN</button>
            <button className="text-gray-800 whitespace-nowrap font-bold" onClick={() => setCurrentView('women')}>WOMEN</button>
            <button className="text-gray-800 whitespace-nowrap font-bold" onClick={() => setCurrentView('brands')}>BRANDS</button>
            <button className="text-gray-800 whitespace-nowrap font-bold" onClick={() => setCurrentView('sale')}>SALE</button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Enhanced Hero Banner Section
const HeroBanners = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  
  const banners = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff",
      title: "WINTER FASHION COLLECTION",
      subtitle: "UP TO 60% OFF + FREE SHIPPING",
      description: "Discover the latest trends in winter fashion",
      cta: "SHOP WOMEN",
      ctaSecondary: "SHOP MEN",
      ctaLink: "women",
      ctaSecondaryLink: "men"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb",
      title: "PREMIUM COLLECTION",
      subtitle: "LUXURY REDEFINED",
      description: "Exclusive designer pieces for the discerning fashionista",
      cta: "EXPLORE PREMIUM",
      ctaSecondary: "VIEW BRANDS",
      ctaLink: "women",
      ctaSecondaryLink: "brands"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586",
      title: "NEW ARRIVALS",
      subtitle: "FRESH STYLES WEEKLY",
      description: "Stay ahead with the latest fashion trends",
      cta: "SHOP NEW",
      ctaSecondary: "VIEW ALL",
      ctaLink: "women",
      ctaSecondaryLink: "men"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1678637803384-947954f11c10",
      title: "WORK WEAR COLLECTION",
      subtitle: "PROFESSIONAL ELEGANCE",
      description: "Power dressing for the modern professional",
      cta: "SHOP WORK WEAR",
      ctaSecondary: "FORMAL COLLECTION",
      ctaLink: "women",
      ctaSecondaryLink: "men"
    }
  ];

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000); // Slower rotation for better user experience
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Main Banner Slider */}
      <div className="relative">
        {banners.map((banner, index) => (
          <div 
            key={banner.id} 
            className={`transition-all duration-700 ease-in-out ${
              index === currentBanner ? 'translate-x-0 opacity-100' : 
              index < currentBanner ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
            } ${index !== currentBanner ? 'absolute inset-0' : ''}`}
          >
            <div className="relative">
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-80 md:h-96 lg:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent">
                <div className="container mx-auto px-4 h-full flex items-center">
                  <div className="max-w-3xl text-white">
                    <div className="mb-6">
                      <span className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 text-sm font-bold uppercase tracking-wide rounded-full mb-6 shadow-lg">
                        Limited Time Offer
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight banner-text bg-gradient-to-r from-white to-gray-200 bg-clip-text">
                      {banner.title}
                    </h1>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-yellow-400 mb-4 banner-text drop-shadow-lg">
                      {banner.subtitle}
                    </h2>
                    <p className="text-xl md:text-2xl mb-10 opacity-90 banner-text leading-relaxed">
                      {banner.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-10 py-4 font-bold text-lg uppercase tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-2xl rounded-full"
                        onClick={() => setCurrentView(banner.ctaLink)}
                      >
                        {banner.cta}
                      </button>
                      <button 
                        className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-10 py-4 font-bold text-lg uppercase tracking-wide transition-all duration-300 rounded-full backdrop-blur-sm"
                        onClick={() => setCurrentView(banner.ctaSecondaryLink)}
                      >
                        {banner.ctaSecondary}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Banner Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBanner(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index === currentBanner 
                ? 'bg-white scale-125 shadow-lg' 
                : 'bg-white/50 hover:bg-white/75 hover:scale-110'
            }`}
          />
        ))}
      </div>

      {/* Enhanced Navigation Arrows */}
      <button 
        onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg hover:scale-110"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg hover:scale-110"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Enhanced Promotional Strip */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-12 text-sm font-medium animate-pulse">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="uppercase tracking-wide">FREE SHIPPING ABOVE ₹999</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="uppercase tracking-wide">EASY 30-DAY RETURNS</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="uppercase tracking-wide">100% AUTHENTIC PRODUCTS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Section with comprehensive categories
const CategorySection = ({ title, categories }) => {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800">{title}</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <div key={index} className="text-center cursor-pointer group">
              <div className="w-full aspect-square rounded-full overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs md:text-sm font-medium text-gray-700">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Deals Section with more categories
const DealsSection = () => {
  const deals = [
    { discount: "40-70% OFF", category: "Shirts & T-Shirts", subcategory: "Men's Topwear", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { discount: "50-80% OFF", category: "Dresses & Kurtas", subcategory: "Women's Wear", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { discount: "30-60% OFF", category: "Track Pants & Joggers", subcategory: "Sportswear", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { discount: "25-50% OFF", category: "Jeans & Trousers", subcategory: "Bottomwear", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { discount: "35-65% OFF", category: "Ethnic Wear", subcategory: "Festive Collection", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { discount: "20-40% OFF", category: "Footwear", subcategory: "Shoes & Sandals", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { discount: "15-30% OFF", category: "Accessories", subcategory: "Bags & Watches", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { discount: "10-25% OFF", category: "Beauty & Personal Care", subcategory: "Skincare & Makeup", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" }
  ];

  return (
    <div className="bg-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">DEALS OF THE DAY</h2>
          <p className="text-gray-600">Limited Time Offers</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {deals.slice(0, 8).map((deal, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <img src={deal.image} alt={deal.category} className="w-full h-32 md:h-40 object-cover" />
              <div className="p-3 text-center">
                <p className="font-bold text-pink-600 text-sm md:text-base">{deal.discount}</p>
                <p className="text-xs md:text-sm text-gray-800 font-medium">{deal.category}</p>
                <p className="text-xs text-gray-500">{deal.subcategory}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Product Card - Myntra Style
const ProductCard = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product.id, selectedSize, selectedColor, 1);
    alert('Added to bag!');
  };

  const discountPrice = (product.price * 0.8).toFixed(2);
  const discountPercent = 20;

  return (
    <div 
      className="bg-white cursor-pointer group"
      onClick={() => onViewDetails(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-pink-600 text-white px-2 py-1 text-xs font-bold">BESTSELLER</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <button className="bg-white rounded-full p-1 shadow-md hover:bg-pink-50">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
        {/* Quick View on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end justify-center pb-4">
            <button 
              onClick={handleAddToCart}
              className="bg-white text-gray-800 px-6 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              ADD TO BAG
            </button>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{product.name.split(' ')[0]}</h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.name}</p>
        
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-gray-800">₹{discountPrice}</span>
          <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
          <span className="text-xs text-orange-600 font-medium">({discountPercent}% OFF)</span>
        </div>
        
        {/* Rating */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center bg-green-600 text-white px-1 py-0.5 rounded text-xs">
            <span>4.2</span>
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">(1.2k)</span>
        </div>
      </div>
    </div>
  );
};

// Products Section - Myntra Style
const ProductsSection = ({ title = "TRENDING NOW", filter = null }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API}/products`;
      if (filter) {
        url += `?category=${filter}`;
      }
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 10).map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>
        
        {/* View All Button */}
        <div className="text-center mt-8">
          <button className="border-2 border-pink-600 text-pink-600 px-8 py-2 font-bold text-sm hover:bg-pink-600 hover:text-white transition-colors">
            VIEW ALL
          </button>
        </div>
      </div>
    </div>
  );
};

// Product Modal (simplified for Myntra style)
const ProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  const handleAddToCart = () => {
    addToCart(product.id, selectedSize, selectedColor, 1);
    alert('Added to bag!');
    onClose();
  };

  const discountPrice = (product.price * 0.8).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{product.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
              
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl font-bold">₹{discountPrice}</span>
                <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                <span className="text-orange-600 font-medium">(20% OFF)</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">SELECT SIZE</label>
                  <div className="flex space-x-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 border-2 font-medium text-sm ${
                          selectedSize === size
                            ? 'border-pink-600 text-pink-600'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">COLOR</label>
                  <select 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                  >
                    {product.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-pink-600 text-white py-3 font-bold text-sm hover:bg-pink-700 transition-colors"
                >
                  ADD TO BAG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Homepage Component with comprehensive categories
const Homepage = () => {
  // Men's Categories
  const menCategories = [
    { name: "T-Shirts", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Casual Shirts", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Formal Shirts", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Jeans", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Kurtas", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Blazers", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Shorts", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Track Pants", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" }
  ];

  // Women's Categories
  const womenCategories = [
    { name: "Kurtas & Suits", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Sarees", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Dresses", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Tops", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Jeans", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Lehenga Choli", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Lingerie", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Western Wear", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" }
  ];

  // Kids Categories
  const kidsCategories = [
    { name: "Boys T-Shirts", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Girls Dresses", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Boys Shirts", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Girls Tops", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Boys Jeans", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Girls Lehenga", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Footwear", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Toys & Games", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" }
  ];

  // Home & Living Categories
  const homeLivingCategories = [
    { name: "Bedsheets", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Curtains", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Cushions", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Bath Towels", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Home Décor", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Kitchen", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Lamps", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Storage", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" }
  ];

  // Beauty Categories
  const beautyCategories = [
    { name: "Makeup", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Skincare", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Hair Care", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Fragrances", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Men's Grooming", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Wellness", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Premium Beauty", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Beauty Tools", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" }
  ];

  return (
    <div>
      <HeroBanners />
      
      {/* Men's Categories */}
      <CategorySection title="MEN'S FASHION" categories={menCategories} />
      
      {/* Women's Categories */}
      <CategorySection title="WOMEN'S FASHION" categories={womenCategories} />
      
      {/* Deals Section */}
      <DealsSection />
      
      {/* Kids Categories */}
      <CategorySection title="KIDS WEAR" categories={kidsCategories} />
      
      {/* Home & Living Categories */}
      <CategorySection title="HOME & LIVING" categories={homeLivingCategories} />
      
      {/* Beauty Categories */}
      <CategorySection title="BEAUTY & PERSONAL CARE" categories={beautyCategories} />
      
      {/* Featured Products */}
      <ProductsSection title="TRENDING NOW" />
      <ProductsSection title="BESTSELLERS" filter="featured" />
    </div>
  );
};

// Cart Page - Myntra Style
const CartPage = () => {
  const { cartItems, updateCartItem, removeFromCart, sessionId } = useCart();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [cartItems]);

  const fetchProductDetails = async () => {
    if (cartItems.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      const productPromises = productIds.map(id => axios.get(`${API}/products/${id}`));
      const responses = await Promise.all(productPromises);
      
      const productsMap = {};
      responses.forEach(response => {
        productsMap[response.data.id] = response.data;
      });
      
      setProducts(productsMap);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products[item.product_id];
      const discountPrice = product ? product.price * 0.8 : 0;
      return total + (discountPrice * item.quantity);
    }, 0).toFixed(2);
  };

  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products[item.product_id];
      return total + (product ? product.price * item.quantity : 0);
    }, 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">Loading your bag...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M8 11h8l1 9H7l1-9z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your bag is empty</h2>
          <p className="text-gray-600">Add some amazing products to get started!</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-pink-600 text-white px-8 py-3 font-bold text-sm hover:bg-pink-700 transition-colors"
        >
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Bag ({cartItems.length} items)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {cartItems.map(item => {
            const product = products[item.product_id];
            if (!product) return null;
            
            const discountPrice = (product.price * 0.8).toFixed(2);
            
            return (
              <div key={item.id} className="flex space-x-4 p-4 border-b">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-24 h-32 object-cover"
                />
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Size: {item.size} | Color: {item.color}
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="font-bold">₹{discountPrice}</span>
                    <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
                    <span className="text-sm text-orange-600">(20% OFF)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                        className="border border-gray-300 w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="border border-gray-300 w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-gray-500 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Price Details</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total MRP</span>
                <span>₹{calculateOriginalTotal()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount on MRP</span>
                <span>-₹{(calculateOriginalTotal() - calculateTotal()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Convenience Fee</span>
                <span>₹99</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>₹{(parseFloat(calculateTotal()) + 99).toFixed(2)}</span>
              </div>
            </div>
            
            <button className="w-full bg-pink-600 text-white py-3 font-bold text-sm hover:bg-pink-700 transition-colors mb-4">
              PLACE ORDER
            </button>
            
            <div className="text-center">
              <svg className="w-6 h-6 inline-block mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600">Safe and Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Online Shopping */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">ONLINE SHOPPING</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-pink-600 transition-colors">Men</a></li>
              <li className="ml-2 space-y-1">
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">T-Shirts & Polos</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Shirts</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Jeans</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Kurtas</a></div>
              </li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Women</a></li>
              <li className="ml-2 space-y-1">
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Sarees</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Kurtas & Suits</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Dresses</a></div>
                <div><a href="#" className="hover:text-pink-600 transition-colors text-xs">Tops</a></div>
              </li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Kids</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Home & Living</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Beauty</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Footwear</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Accessories</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Gift Cards</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">StyleHub Insider</a></li>
            </ul>
          </div>

          {/* Customer Policies */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">CUSTOMER POLICIES</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-pink-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">T&C</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Terms Of Use</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Track Orders</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Shipping</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Cancellation</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Experience StyleHub App */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">EXPERIENCE STYLEHUB APP</h3>
            <div className="space-y-3 mb-6">
              <a href="#" className="block">
                <img 
                  src="https://constant.myntassets.com/web/assets/img/80cc455a-92d2-4b5c-a038-7da0d92af33f1539674178924-google_play.png" 
                  alt="Get it on Google Play" 
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img 
                  src="https://constant.myntassets.com/web/assets/img/bc5e11ad-0250-420a-ac71-115a57ca35d51539674178941-apple_store.png" 
                  alt="Download on App Store" 
                  className="h-10"
                />
              </a>
            </div>
            
            <h4 className="font-bold text-gray-800 mb-3 text-sm">KEEP IN TOUCH</h4>
            <div className="flex space-x-3">
              <a href="#" className="bg-gray-200 hover:bg-pink-100 p-2 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-200 hover:bg-pink-100 p-2 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-200 hover:bg-pink-100 p-2 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.608 2.319-.757 2.877-.274 1.074-1.009 2.424-1.503 3.247C9.013 23.709 10.473 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-200 hover:bg-pink-100 p-2 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Popular Searches */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">POPULAR SEARCHES</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'T-Shirts', 'Kurtas', 'Casual Shirts', 'Formal Shirts', 'Jeans', 'Track Pants',
                'Sarees', 'Dresses', 'Tops', 'Lehenga Choli', 'Kurtis', 'Ethnic Wear',
                'Boys Clothing', 'Girls Dresses', 'Kids Footwear', 'Toys',
                'Bedsheets', 'Curtains', 'Bath Towels', 'Home Décor', 'Kitchen', 'Storage',
                'Makeup', 'Skincare', 'Hair Care', 'Fragrances', 'Men\'s Grooming', 'Wellness',
                'Footwear', 'Sneakers', 'Formal Shoes', 'Sandals', 'Heels', 'Flats',
                'Handbags', 'Backpacks', 'Wallets', 'Belts', 'Watches', 'Sunglasses',
                'Innerwear', 'Sleepwear', 'Activewear', 'Swimwear', 'Winter Wear', 'Rainwear'
              ].map((item, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="bg-gray-100 hover:bg-pink-100 text-gray-600 hover:text-pink-600 px-2 py-1 rounded transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Security Section */}
      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Partners */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-sm">100% ORIGINAL</h3>
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gray-100 p-3 rounded">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">guarantee for all products at StyleHub.com</p>
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-sm">RETURN WITHIN 30 DAYS</h3>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-3 rounded">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">of receiving your order</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © 2024 StyleHub. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-pink-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Sitemap</a>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">Secured by</span>
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold rounded">SSL</div>
                <div className="bg-blue-600 text-white px-2 py-1 text-xs font-bold rounded">256</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await axios.post(`${API}/init-data`);
      setInitialized(true);
    } catch (error) {
      console.error('Error initializing data:', error);
      setInitialized(true);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'cart':
        return <CartPage />;
      case 'men':
      case 'women':
      case 'kids':
      case 'home-living':
      case 'beauty':
        return <ProductsSection title={currentView.toUpperCase().replace('-', ' & ')} filter={`${currentView}_wear`} />;
      default:
        return <Homepage />;
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading StyleHub...</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        {renderContent()}
        <Footer />
      </div>
    </CartProvider>
  );
};

export default App;