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

// Mobile-first Header Component
const Header = ({ currentView, setCurrentView }) => {
  const { cartTotal } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setCurrentView('home')}
            >
              StyleHub
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              className={`text-sm font-medium transition-colors ${
                currentView === 'home' ? 'text-black' : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button 
              className={`text-sm font-medium transition-colors ${
                currentView === 'products' ? 'text-black' : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => setCurrentView('products')}
            >
              Shop
            </button>
            <button 
              className={`text-sm font-medium transition-colors ${
                currentView === 'about' ? 'text-black' : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => setCurrentView('about')}
            >
              About
            </button>
          </nav>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button 
              className="relative"
              onClick={() => setCurrentView('cart')}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M8 11h8l1 9H7l1-9z" />
              </svg>
              {cartTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartTotal}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <button 
              className="block w-full text-left text-gray-600 hover:text-black"
              onClick={() => {
                setCurrentView('home');
                setIsMenuOpen(false);
              }}
            >
              Home
            </button>
            <button 
              className="block w-full text-left text-gray-600 hover:text-black"
              onClick={() => {
                setCurrentView('products');
                setIsMenuOpen(false);
              }}
            >
              Shop
            </button>
            <button 
              className="block w-full text-left text-gray-600 hover:text-black"
              onClick={() => {
                setCurrentView('about');
                setIsMenuOpen(false);
              }}
            >
              About
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

// Mobile-first Hero Section
const Hero = () => {
  return (
    <div className="relative bg-white">
      {/* Mobile-first layout */}
      <div className="px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Discover Fashion That Speaks To You
              </h1>
              <p className="text-gray-600 text-lg mb-6 max-w-lg mx-auto lg:mx-0">
                Explore our curated collection of premium clothing designed for the modern fashion enthusiast.
              </p>
              <button 
                className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
              >
                SHOP NOW
              </button>
            </div>
            
            {/* Hero Image */}
            <div className="order-first lg:order-last">
              <img 
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"
                alt="Fashion Collection"
                className="w-full h-64 md:h-80 lg:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-first Product Card
const ProductCard = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [showOptions, setShowOptions] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product.id, selectedSize, selectedColor, 1);
    alert('Added to cart!');
  };

  return (
    <div className="bg-white">
      {/* Product Image */}
      <div 
        className="relative aspect-[3/4] cursor-pointer group"
        onClick={() => onViewDetails(product)}
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.featured && (
          <span className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs">
            FEATURED
          </span>
        )}
        {/* Quick Add Button - Desktop only */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 hidden md:flex items-end justify-center pb-4">
          <button 
            onClick={handleAddToCart}
            className="bg-white text-black px-6 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
          >
            QUICK ADD
          </button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="py-3">
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">${product.price}</p>
        
        {/* Color options */}
        <div className="flex space-x-1 mb-3">
          {product.colors.slice(0, 4).map((color, index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full border border-gray-200 ${
                color.toLowerCase() === 'white' ? 'bg-white' :
                color.toLowerCase() === 'black' ? 'bg-black' :
                color.toLowerCase() === 'blue' ? 'bg-blue-500' :
                color.toLowerCase() === 'red' ? 'bg-red-500' :
                color.toLowerCase() === 'yellow' ? 'bg-yellow-500' :
                color.toLowerCase() === 'green' ? 'bg-green-500' :
                color.toLowerCase() === 'pink' ? 'bg-pink-500' :
                color.toLowerCase() === 'purple' ? 'bg-purple-500' :
                color.toLowerCase() === 'gray' ? 'bg-gray-500' :
                color.toLowerCase() === 'navy' ? 'bg-blue-900' :
                color.toLowerCase() === 'maroon' ? 'bg-red-900' :
                'bg-gray-300'
              }`}
              title={color}
            />
          ))}
        </div>

        {/* Mobile Add to Cart */}
        <div className="md:hidden">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="w-full bg-black text-white py-2 text-sm font-medium"
          >
            ADD TO CART
          </button>
          
          {showOptions && (
            <div className="mt-2 space-y-2">
              <select 
                value={selectedSize} 
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm"
              >
                {product.sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <select 
                value={selectedColor} 
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm"
              >
                {product.colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
              <button 
                onClick={handleAddToCart}
                className="w-full bg-gray-900 text-white py-2 text-sm font-medium"
              >
                CONFIRM ADD TO CART
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Product Modal (unchanged functionality, updated styling)
const ProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product.id, selectedSize, selectedColor, quantity);
    alert('Added to cart!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">{product.name}</h2>
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
              <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
              <div className="text-2xl font-medium text-gray-900 mb-6">${product.price}</div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Size</label>
                  <select 
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                  >
                    {product.sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Color</label>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  ADD TO CART
                </button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                {product.stock_quantity} items in stock
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-first Products Section
const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'formal_wear', label: 'Formal' },
    { value: 'womens_dresses', label: 'Dresses' },
    { value: 'sportswear', label: 'Sport' },
    { value: 'mens_pants', label: 'Pants' },
    { value: 'womens_tops', label: 'Tops' },
    { value: 'casual_wear', label: 'Casual' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  }, [products, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="text-center text-sm text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Shop</h2>
          <p className="text-gray-600 text-sm">Discover our carefully curated collection</p>
        </div>

        {/* Category Filter - Horizontal scroll on mobile */}
        <div className="mb-8">
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid - Mobile-first responsive */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>

        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
};

// Mobile-first Cart Page
const CartPage = () => {
  const { cartItems, updateCartItem, removeFromCart, sessionId } = useCart();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_email: '',
    shipping_address: ''
  });
  const [showCheckout, setShowCheckout] = useState(false);

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
      return total + (product ? product.price * item.quantity : 0);
    }, 0).toFixed(2);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/orders`, {
        ...checkoutForm,
        session_id: sessionId
      });
      alert('Order placed successfully!');
      setShowCheckout(false);
      window.location.reload();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="text-center text-sm text-gray-500">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Your bag is empty</h2>
          <p className="text-gray-600 text-sm mb-8">Add some amazing products to get started!</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-3 text-sm font-medium"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Shopping Bag ({cartItems.length})</h2>
        
        <div className="space-y-4 mb-8">
          {cartItems.map(item => {
            const product = products[item.product_id];
            if (!product) return null;
            
            return (
              <div key={item.id} className="flex space-x-4 py-4 border-b border-gray-100">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-16 h-20 object-cover flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">
                    Size: {item.size} | Color: {item.color}
                  </p>
                  <p className="text-sm font-medium text-gray-900">${product.price}</p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-medium mb-6">
            <span>Total: ${calculateTotal()}</span>
          </div>
          
          <button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-black text-white py-3 text-sm font-medium"
          >
            CHECKOUT
          </button>
        </div>

        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">Checkout</h3>
              <form onSubmit={handleCheckout} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={checkoutForm.customer_name}
                  onChange={(e) => setCheckoutForm({...checkoutForm, customer_name: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={checkoutForm.customer_email}
                  onChange={(e) => setCheckoutForm({...checkoutForm, customer_email: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <textarea
                  placeholder="Shipping Address"
                  value={checkoutForm.shipping_address}
                  onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm h-20"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-2 text-sm"
                  >
                    Place Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
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
      case 'products':
        return <ProductsSection />;
      case 'cart':
        return <CartPage />;
      case 'about':
        return (
          <div className="px-4 py-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About StyleHub</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                StyleHub is your premier destination for high-quality, fashionable clothing. 
                We curate the finest pieces from around the world to bring you a shopping experience 
                that's both luxurious and accessible. Our commitment to quality, style, and customer 
                satisfaction sets us apart in the world of online fashion retail.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <>
            <Hero />
            <ProductsSection />
          </>
        );
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading StyleHub...</p>
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