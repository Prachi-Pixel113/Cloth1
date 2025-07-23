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

// Components
const Header = () => {
  const { cartTotal } = useCart();
  const [currentView, setCurrentView] = useState('home');

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => window.location.reload()}
            >
              StyleHub
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              onClick={() => setCurrentView('products')}
            >
              Products
            </button>
            <button 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              onClick={() => setCurrentView('about')}
            >
              About
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={() => setCurrentView('cart')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7M7 13l-1.5-7M16 16a2 2 0 100 4 2 2 0 000-4zM8 16a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Discover Your Perfect Style
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Explore our curated collection of premium clothing designed for modern fashion enthusiasts.
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105">
              Shop Now
            </button>
          </div>
          <div className="hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"
              alt="Fashion Collection"
              className="rounded-lg shadow-2xl object-cover w-full h-96"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product.id, selectedSize, selectedColor, 1);
    alert('Added to cart!');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
      onClick={() => onViewDetails(product)}
    >
      <div className="relative overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.featured && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
            Featured
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-purple-600">${product.price}</span>
          <span className="text-sm text-gray-500">{product.stock_quantity} in stock</span>
        </div>

        <div className="flex space-x-2 mb-3">
          <select 
            value={selectedSize} 
            onChange={(e) => setSelectedSize(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {product.sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <select 
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {product.colors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleAddToCart}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            
            <div>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="text-3xl font-bold text-purple-600 mb-4">${product.price}</div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select 
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {product.sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {product.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                {product.stock_quantity} items in stock
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'formal_wear', label: 'Formal Wear' },
    { value: 'womens_dresses', label: 'Women\'s Dresses' },
    { value: 'sportswear', label: 'Sportswear' },
    { value: 'mens_pants', label: 'Men\'s Pants' },
    { value: 'womens_tops', label: 'Women\'s Tops' },
    { value: 'casual_wear', label: 'Casual Wear' }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our carefully curated collection of premium clothing for every occasion
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  );
};

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Add some amazing products to get started!</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h2>
      
      <div className="space-y-4 mb-8">
        {cartItems.map(item => {
          const product = products[item.product_id];
          if (!product) return null;
          
          return (
            <div key={item.id} className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-20 h-20 object-cover rounded"
              />
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-gray-600 text-sm">
                  Size: {item.size} | Color: {item.color}
                </p>
                <p className="text-purple-600 font-medium">${product.price}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateCartItem(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              
              <div className="text-right">
                <p className="font-semibold">${(product.price * item.quantity).toFixed(2)}</p>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-xl font-bold mb-4">
          <span>Total: ${calculateTotal()}</span>
        </div>
        
        <button 
          onClick={() => setShowCheckout(true)}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Checkout</h3>
            <form onSubmit={handleCheckout} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={checkoutForm.customer_name}
                onChange={(e) => setCheckoutForm({...checkoutForm, customer_name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={checkoutForm.customer_email}
                onChange={(e) => setCheckoutForm({...checkoutForm, customer_email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Shipping Address"
                value={checkoutForm.shipping_address}
                onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">About StyleHub</h2>
            <p className="text-gray-600 leading-relaxed">
              StyleHub is your premier destination for high-quality, fashionable clothing. 
              We curate the finest pieces from around the world to bring you a shopping experience 
              that's both luxurious and accessible. Our commitment to quality, style, and customer 
              satisfaction sets us apart in the world of online fashion retail.
            </p>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading StyleHub...</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        {renderContent()}
      </div>
    </CartProvider>
  );
};

export default App;