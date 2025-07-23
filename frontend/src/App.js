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
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('men')}
            >
              MEN
            </button>
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('women')}
            >
              WOMEN
            </button>
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('kids')}
            >
              KIDS
            </button>
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('home-living')}
            >
              HOME & LIVING
            </button>
            <button 
              className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors tracking-wide"
              onClick={() => setCurrentView('beauty')}
            >
              BEAUTY
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
          <div className="flex overflow-x-auto space-x-6 text-sm font-medium">
            <button className="text-gray-800 whitespace-nowrap" onClick={() => setCurrentView('men')}>MEN</button>
            <button className="text-gray-800 whitespace-nowrap" onClick={() => setCurrentView('women')}>WOMEN</button>
            <button className="text-gray-800 whitespace-nowrap" onClick={() => setCurrentView('kids')}>KIDS</button>
            <button className="text-gray-800 whitespace-nowrap" onClick={() => setCurrentView('home-living')}>HOME</button>
            <button className="text-gray-800 whitespace-nowrap" onClick={() => setCurrentView('beauty')}>BEAUTY</button>
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
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85",
      title: "BIGGEST FASHION SALE",
      subtitle: "UP TO 70% OFF + FREE SHIPPING",
      description: "On trending styles & bestsellers",
      cta: "SHOP NOW",
      ctaSecondary: "EXPLORE DEALS"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85",
      title: "NEW ARRIVALS",
      subtitle: "FRESH STYLES WEEKLY",
      description: "Discover the latest trends",
      cta: "EXPLORE NEW",
      ctaSecondary: "VIEW ALL"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85",
      title: "PREMIUM COLLECTION",
      subtitle: "LUXURY REDEFINED",
      description: "Exclusive designer pieces",
      cta: "SHOP LUXURY",
      ctaSecondary: "VIEW COLLECTION"
    }
  ];

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Main Banner Slider */}
      <div className="relative">
        {banners.map((banner, index) => (
          <div 
            key={banner.id} 
            className={`transition-transform duration-500 ease-in-out ${
              index === currentBanner ? 'translate-x-0' : 
              index < currentBanner ? '-translate-x-full' : 'translate-x-full'
            } ${index !== currentBanner ? 'absolute inset-0' : ''}`}
          >
            <div className="relative">
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-72 md:h-96 lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent">
                <div className="container mx-auto px-4 h-full flex items-center">
                  <div className="max-w-2xl text-white">
                    <div className="mb-4">
                      <span className="inline-block bg-pink-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full mb-4">
                        Limited Time
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight banner-text">
                      {banner.title}
                    </h1>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-3 banner-text">
                      {banner.subtitle}
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90 banner-text">
                      {banner.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                        {banner.cta}
                      </button>
                      <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 font-bold text-sm uppercase tracking-wide transition-all duration-300">
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

      {/* Banner Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBanner(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentBanner 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Promotional Strip */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 text-sm font-medium">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>FREE SHIPPING</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>EASY RETURNS</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>100% AUTHENTIC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Section
const CategorySection = ({ title, categories }) => {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800">{title}</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
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

// Deals Section
const DealsSection = () => {
  return (
    <div className="bg-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">DEALS OF THE DAY</h2>
          <p className="text-gray-600">Limited Time Offers</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { discount: "40-70% OFF", category: "Shirts", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
            { discount: "50-80% OFF", category: "Dresses", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
            { discount: "30-60% OFF", category: "Sportswear", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
            { discount: "25-50% OFF", category: "Jeans", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" }
          ].map((deal, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <img src={deal.image} alt={deal.category} className="w-full h-32 md:h-40 object-cover" />
              <div className="p-3 text-center">
                <p className="font-bold text-pink-600 text-sm md:text-base">{deal.discount}</p>
                <p className="text-xs md:text-sm text-gray-700">{deal.category}</p>
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

// Homepage Component
const Homepage = () => {
  const categoryData = [
    { name: "Shirts", image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Dresses", image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Jeans", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" },
    { name: "Sportswear", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Formal", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85" },
    { name: "Casual", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85" }
  ];

  return (
    <div>
      <HeroBanners />
      <CategorySection title="SHOP BY CATEGORY" categories={categoryData} />
      <DealsSection />
      <ProductsSection title="TRENDING NOW" />
      <ProductsSection title="FEATURED PRODUCTS" filter="featured" />
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

// Main App Component
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
      </div>
    </CartProvider>
  );
};

export default App;