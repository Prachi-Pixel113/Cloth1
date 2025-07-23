#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for StyleHub Enhanced E-commerce Application
Tests both basic ecommerce workflow AND new enhanced features:
- Enhanced Search API with filters and sorting
- Search Suggestions and Trending Products
- Personalized Recommendations and Recently Viewed
- Product Activity Tracking
- Brand Management System
- Review System with ratings
- Enhanced Product Model with new fields
"""

import requests
import json
import sys
from typing import Dict, List, Any
import time

# Load backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not determine backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
SESSION_ID = "test_session_123"

class StyleHubEnhancedAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.sample_products = []
        self.sample_brands = []
        self.cart_items = []
        self.sample_reviews = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            print(f"   This is a CRITICAL failure that blocks core functionality")
        print()

    # ========== ENHANCED INIT DATA TEST ==========
    def test_enhanced_init_data(self):
        """Test POST /api/init-data to create brands and enhanced products"""
        print("🧪 Testing Enhanced Sample Data Initialization...")
        
        try:
            response = self.session.post(f"{API_BASE}/init-data")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and ("brands" in data["message"] or "Initialized" in data["message"]):
                    self.log_test("Enhanced Initialize Sample Data", True, f"Response: {data['message']}")
                    return True
                else:
                    self.log_test("Enhanced Initialize Sample Data", False, "Missing brands/products initialization message")
                    return False
            else:
                self.log_test("Enhanced Initialize Sample Data", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Enhanced Initialize Sample Data", False, f"Request failed: {str(e)}")
            return False

    # ========== BRAND MANAGEMENT TESTS ==========
    def test_get_all_brands(self):
        """Test GET /api/brands to fetch all brands"""
        print("🧪 Testing Get All Brands...")
        
        try:
            response = self.session.get(f"{API_BASE}/brands")
            
            if response.status_code == 200:
                brands = response.json()
                if isinstance(brands, list) and len(brands) > 0:
                    self.sample_brands = brands
                    # Verify brand fields
                    first_brand = brands[0]
                    required_fields = ['id', 'name', 'description', 'logo_url', 'brand_story']
                    missing_fields = [field for field in required_fields if field not in first_brand]
                    
                    if not missing_fields:
                        self.log_test("Get All Brands", True, f"Retrieved {len(brands)} brands with all required fields")
                        return True
                    else:
                        self.log_test("Get All Brands", False, f"Missing brand fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Get All Brands", False, "No brands returned or invalid format")
                    return False
            else:
                self.log_test("Get All Brands", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get All Brands", False, f"Request failed: {str(e)}")
            return False

    def test_get_individual_brand(self):
        """Test GET /api/brands/{brand_id} for individual brands"""
        print("🧪 Testing Individual Brand Retrieval...")
        
        if not self.sample_brands:
            self.log_test("Individual Brand Retrieval", False, "No sample brands available for testing")
            return False
        
        brand_id = self.sample_brands[0]['id']
        
        try:
            response = self.session.get(f"{API_BASE}/brands/{brand_id}")
            
            if response.status_code == 200:
                brand = response.json()
                if brand.get('id') == brand_id:
                    required_fields = ['id', 'name', 'description', 'logo_url', 'brand_story']
                    missing_fields = [field for field in required_fields if field not in brand]
                    
                    if not missing_fields:
                        self.log_test("Individual Brand Retrieval", True, f"Retrieved brand: {brand['name']}")
                        return True
                    else:
                        self.log_test("Individual Brand Retrieval", False, f"Missing fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Individual Brand Retrieval", False, "Brand ID mismatch")
                    return False
            else:
                self.log_test("Individual Brand Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Individual Brand Retrieval", False, f"Request failed: {str(e)}")
            return False

    def test_get_brand_products(self):
        """Test GET /api/brands/{brand_id}/products"""
        print("🧪 Testing Brand Products...")
        
        if not self.sample_brands:
            self.log_test("Brand Products", False, "No sample brands available for testing")
            return False
        
        brand_id = self.sample_brands[0]['id']
        
        try:
            response = self.session.get(f"{API_BASE}/brands/{brand_id}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        # Verify all products belong to the brand
                        all_correct_brand = all(p.get('brand_id') == brand_id for p in products)
                        if all_correct_brand:
                            self.log_test("Brand Products", True, f"Found {len(products)} products for brand")
                            return True
                        else:
                            self.log_test("Brand Products", False, "Some products don't belong to the requested brand")
                            return False
                    else:
                        self.log_test("Brand Products", True, "No products found for brand (valid)")
                        return True
                else:
                    self.log_test("Brand Products", False, "Invalid response format")
                    return False
            else:
                self.log_test("Brand Products", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Brand Products", False, f"Request failed: {str(e)}")
            return False

    # ========== ENHANCED PRODUCT TESTS ==========
    def test_get_enhanced_products(self):
        """Test GET /api/products to fetch enhanced products with new fields"""
        print("🧪 Testing Get Enhanced Products...")
        
        try:
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    self.sample_products = products
                    # Verify enhanced product fields
                    first_product = products[0]
                    required_fields = ['id', 'name', 'description', 'price', 'category', 'sizes', 'colors', 'stock_quantity']
                    enhanced_fields = ['brand_id', 'brand_name', 'tags', 'materials', 'average_rating', 'view_count']
                    
                    missing_required = [field for field in required_fields if field not in first_product]
                    missing_enhanced = [field for field in enhanced_fields if field not in first_product]
                    
                    if not missing_required:
                        if not missing_enhanced:
                            self.log_test("Get Enhanced Products", True, f"Retrieved {len(products)} products with all enhanced fields")
                        else:
                            self.log_test("Get Enhanced Products", True, f"Retrieved {len(products)} products (missing some enhanced fields: {missing_enhanced})")
                        return True
                    else:
                        self.log_test("Get Enhanced Products", False, f"Missing required fields: {missing_required}")
                        return False
                else:
                    self.log_test("Get Enhanced Products", False, "No products returned or invalid format")
                    return False
            else:
                self.log_test("Get Enhanced Products", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Enhanced Products", False, f"Request failed: {str(e)}")
            return False

    # ========== ENHANCED SEARCH TESTS ==========
    def test_enhanced_search_api(self):
        """Test POST /api/products/search with SearchQuery model"""
        print("🧪 Testing Enhanced Search API...")
        
        # Test various search scenarios
        search_tests = [
            {
                "name": "Text Search",
                "query": {
                    "query": "shirt",
                    "limit": 10,
                    "skip": 0
                }
            },
            {
                "name": "Category Filter",
                "query": {
                    "query": "",
                    "category": "formal_wear",
                    "limit": 10,
                    "skip": 0
                }
            },
            {
                "name": "Price Range Filter",
                "query": {
                    "query": "",
                    "min_price": 50.0,
                    "max_price": 150.0,
                    "limit": 10,
                    "skip": 0
                }
            },
            {
                "name": "Size Filter",
                "query": {
                    "query": "",
                    "sizes": ["M", "L"],
                    "limit": 10,
                    "skip": 0
                }
            },
            {
                "name": "Sort by Price Low",
                "query": {
                    "query": "",
                    "sort_by": "price_low",
                    "limit": 5,
                    "skip": 0
                }
            }
        ]
        
        for test_case in search_tests:
            try:
                response = self.session.post(f"{API_BASE}/products/search", json=test_case["query"])
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        self.log_test(f"Enhanced Search ({test_case['name']})", True, f"Found {len(products)} products")
                    else:
                        self.log_test(f"Enhanced Search ({test_case['name']})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Enhanced Search ({test_case['name']})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Enhanced Search ({test_case['name']})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_search_suggestions(self):
        """Test GET /api/products/suggestions?q=<query>"""
        print("🧪 Testing Search Suggestions...")
        
        test_queries = ["sh", "dr", "sp"]
        
        for query in test_queries:
            try:
                response = self.session.get(f"{API_BASE}/products/suggestions", params={"q": query})
                
                if response.status_code == 200:
                    data = response.json()
                    if "suggestions" in data and isinstance(data["suggestions"], list):
                        self.log_test(f"Search Suggestions ('{query}')", True, f"Got {len(data['suggestions'])} suggestions")
                    else:
                        self.log_test(f"Search Suggestions ('{query}')", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Search Suggestions ('{query}')", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Search Suggestions ('{query}')", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_trending_products(self):
        """Test GET /api/products/trending"""
        print("🧪 Testing Trending Products...")
        
        periods = ["daily", "weekly", "monthly"]
        
        for period in periods:
            try:
                response = self.session.get(f"{API_BASE}/products/trending", params={"period": period, "limit": 5})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        self.log_test(f"Trending Products ({period})", True, f"Found {len(products)} trending products")
                    else:
                        self.log_test(f"Trending Products ({period})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Trending Products ({period})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Trending Products ({period})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    # ========== USER ACTIVITY & RECOMMENDATIONS TESTS ==========
    def test_product_activity_tracking(self):
        """Test POST /api/products/{product_id}/track-activity"""
        print("🧪 Testing Product Activity Tracking...")
        
        if not self.sample_products:
            self.log_test("Product Activity Tracking", False, "No sample products available for testing")
            return False
        
        product_id = self.sample_products[0]['id']
        
        # Use query parameters instead of JSON body
        params = {
            "session_id": SESSION_ID,
            "activity_type": "view",
            "additional_data": {"source": "search"}
        }
        
        try:
            response = self.session.post(f"{API_BASE}/products/{product_id}/track-activity", params=params)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Product Activity Tracking", True, f"Activity tracked: {result['message']}")
                    return True
                else:
                    self.log_test("Product Activity Tracking", False, "Missing confirmation message")
                    return False
            else:
                self.log_test("Product Activity Tracking", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Product Activity Tracking", False, f"Request failed: {str(e)}")
            return False

    def test_personalized_recommendations(self):
        """Test GET /api/products/recommended/{session_id}"""
        print("🧪 Testing Personalized Recommendations...")
        
        try:
            response = self.session.get(f"{API_BASE}/products/recommended/{SESSION_ID}", params={"limit": 5})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    self.log_test("Personalized Recommendations", True, f"Got {len(products)} recommended products")
                    return True
                else:
                    self.log_test("Personalized Recommendations", False, "Invalid response format")
                    return False
            else:
                self.log_test("Personalized Recommendations", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Personalized Recommendations", False, f"Request failed: {str(e)}")
            return False

    def test_recently_viewed_products(self):
        """Test GET /api/products/recently-viewed/{session_id}"""
        print("🧪 Testing Recently Viewed Products...")
        
        try:
            response = self.session.get(f"{API_BASE}/products/recently-viewed/{SESSION_ID}", params={"limit": 5})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    self.log_test("Recently Viewed Products", True, f"Got {len(products)} recently viewed products")
                    return True
                else:
                    self.log_test("Recently Viewed Products", False, "Invalid response format")
                    return False
            else:
                self.log_test("Recently Viewed Products", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Recently Viewed Products", False, f"Request failed: {str(e)}")
            return False

    # ========== REVIEW SYSTEM TESTS ==========
    def test_create_product_review(self):
        """Test POST /api/products/{product_id}/reviews"""
        print("🧪 Testing Create Product Review...")
        
        if not self.sample_products:
            self.log_test("Create Product Review", False, "No sample products available for testing")
            return False
        
        product_id = self.sample_products[0]['id']
        
        review_data = {
            "user_name": "Alex Thompson",
            "user_email": "alex.thompson@example.com",
            "rating": 5,
            "title": "Excellent quality!",
            "comment": "This product exceeded my expectations. Great quality and fast shipping.",
            "images": []
        }
        
        try:
            response = self.session.post(f"{API_BASE}/products/{product_id}/reviews", json=review_data)
            
            if response.status_code == 200:
                review = response.json()
                required_fields = ['id', 'product_id', 'user_name', 'rating', 'title', 'comment']
                missing_fields = [field for field in required_fields if field not in review]
                
                if not missing_fields:
                    self.sample_reviews.append(review)
                    self.log_test("Create Product Review", True, f"Review created with ID: {review['id']}")
                    return True
                else:
                    self.log_test("Create Product Review", False, f"Missing review fields: {missing_fields}")
                    return False
            else:
                self.log_test("Create Product Review", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Product Review", False, f"Request failed: {str(e)}")
            return False

    def test_get_product_reviews(self):
        """Test GET /api/products/{product_id}/reviews"""
        print("🧪 Testing Get Product Reviews...")
        
        if not self.sample_products:
            self.log_test("Get Product Reviews", False, "No sample products available for testing")
            return False
        
        product_id = self.sample_products[0]['id']
        
        try:
            response = self.session.get(f"{API_BASE}/products/{product_id}/reviews", params={"limit": 10})
            
            if response.status_code == 200:
                reviews = response.json()
                if isinstance(reviews, list):
                    self.log_test("Get Product Reviews", True, f"Retrieved {len(reviews)} reviews")
                    return True
                else:
                    self.log_test("Get Product Reviews", False, "Invalid response format")
                    return False
            else:
                self.log_test("Get Product Reviews", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Product Reviews", False, f"Request failed: {str(e)}")
            return False

    def test_mark_review_helpful(self):
        """Test PUT /api/reviews/{review_id}/helpful"""
        print("🧪 Testing Mark Review Helpful...")
        
        if not self.sample_reviews:
            self.log_test("Mark Review Helpful", False, "No sample reviews available for testing")
            return False
        
        review_id = self.sample_reviews[0]['id']
        
        try:
            response = self.session.put(f"{API_BASE}/reviews/{review_id}/helpful")
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Mark Review Helpful", True, f"Review marked helpful: {result['message']}")
                    return True
                else:
                    self.log_test("Mark Review Helpful", False, "Missing confirmation message")
                    return False
            else:
                self.log_test("Mark Review Helpful", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Mark Review Helpful", False, f"Request failed: {str(e)}")
            return False

    # ========== BASIC ECOMMERCE TESTS (EXISTING) ==========
    def test_get_products_by_category(self):
        """Test GET /api/products with category filtering"""
        print("🧪 Testing Product Category Filtering...")
        
        categories_to_test = ["formal_wear", "womens_dresses", "sportswear"]
        
        for category in categories_to_test:
            try:
                response = self.session.get(f"{API_BASE}/products", params={"category": category})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            all_correct_category = all(p.get('category') == category for p in products)
                            if all_correct_category:
                                self.log_test(f"Category Filter ({category})", True, f"Found {len(products)} products in category")
                            else:
                                self.log_test(f"Category Filter ({category})", False, "Some products don't match requested category")
                                return False
                        else:
                            self.log_test(f"Category Filter ({category})", True, f"No products in category {category} (valid)")
                    else:
                        self.log_test(f"Category Filter ({category})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Category Filter ({category})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Category Filter ({category})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_get_featured_products(self):
        """Test GET /api/products with featured filtering"""
        print("🧪 Testing Featured Products Filter...")
        
        try:
            response = self.session.get(f"{API_BASE}/products", params={"featured": True})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        all_featured = all(p.get('featured') == True for p in products)
                        if all_featured:
                            self.log_test("Featured Products Filter", True, f"Found {len(products)} featured products")
                            return True
                        else:
                            self.log_test("Featured Products Filter", False, "Some products are not marked as featured")
                            return False
                    else:
                        self.log_test("Featured Products Filter", True, "No featured products found (valid)")
                        return True
                else:
                    self.log_test("Featured Products Filter", False, "Invalid response format")
                    return False
            else:
                self.log_test("Featured Products Filter", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Featured Products Filter", False, f"Request failed: {str(e)}")
            return False

    def test_get_individual_product(self):
        """Test GET /api/products/{product_id} for individual products"""
        print("🧪 Testing Individual Product Retrieval...")
        
        if not self.sample_products:
            self.log_test("Individual Product Retrieval", False, "No sample products available for testing")
            return False
        
        product_id = self.sample_products[0]['id']
        
        try:
            # Test with session_id to track activity
            response = self.session.get(f"{API_BASE}/products/{product_id}", params={"session_id": SESSION_ID})
            
            if response.status_code == 200:
                product = response.json()
                if product.get('id') == product_id:
                    required_fields = ['id', 'name', 'description', 'price', 'category', 'sizes', 'colors']
                    missing_fields = [field for field in required_fields if field not in product]
                    
                    if not missing_fields:
                        self.log_test("Individual Product Retrieval", True, f"Retrieved product: {product['name']}")
                        return True
                    else:
                        self.log_test("Individual Product Retrieval", False, f"Missing fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Individual Product Retrieval", False, "Product ID mismatch")
                    return False
            else:
                self.log_test("Individual Product Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Individual Product Retrieval", False, f"Request failed: {str(e)}")
            return False

    def test_add_to_cart(self):
        """Test POST /api/cart to add items to cart"""
        print("🧪 Testing Add Items to Cart...")
        
        if not self.sample_products:
            self.log_test("Add to Cart", False, "No sample products available for testing")
            return False
        
        # Add multiple items to cart
        test_items = [
            {
                "product_id": self.sample_products[0]['id'],
                "size": "M",
                "color": self.sample_products[0]['colors'][0],
                "quantity": 2,
                "session_id": SESSION_ID
            },
            {
                "product_id": self.sample_products[1]['id'] if len(self.sample_products) > 1 else self.sample_products[0]['id'],
                "size": "L",
                "color": self.sample_products[1]['colors'][0] if len(self.sample_products) > 1 else self.sample_products[0]['colors'][0],
                "quantity": 1,
                "session_id": SESSION_ID
            }
        ]
        
        for i, item in enumerate(test_items):
            try:
                response = self.session.post(f"{API_BASE}/cart", json=item)
                
                if response.status_code == 200:
                    cart_item = response.json()
                    if cart_item.get('id') and cart_item.get('product_id') == item['product_id']:
                        self.cart_items.append(cart_item)
                        self.log_test(f"Add to Cart (Item {i+1})", True, f"Added item with ID: {cart_item['id']}")
                    else:
                        self.log_test(f"Add to Cart (Item {i+1})", False, "Invalid cart item response")
                        return False
                else:
                    self.log_test(f"Add to Cart (Item {i+1})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Add to Cart (Item {i+1})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_get_cart(self):
        """Test GET /api/cart/{session_id} to retrieve cart items"""
        print("🧪 Testing Get Cart Items...")
        
        try:
            response = self.session.get(f"{API_BASE}/cart/{SESSION_ID}")
            
            if response.status_code == 200:
                cart_items = response.json()
                if isinstance(cart_items, list):
                    if len(cart_items) >= len(self.cart_items):
                        if cart_items:
                            required_fields = ['id', 'product_id', 'size', 'color', 'quantity', 'session_id']
                            first_item = cart_items[0]
                            missing_fields = [field for field in required_fields if field not in first_item]
                            
                            if not missing_fields:
                                self.log_test("Get Cart Items", True, f"Retrieved {len(cart_items)} cart items")
                                return True
                            else:
                                self.log_test("Get Cart Items", False, f"Missing fields in cart items: {missing_fields}")
                                return False
                        else:
                            self.log_test("Get Cart Items", True, "Empty cart (valid)")
                            return True
                    else:
                        self.log_test("Get Cart Items", False, f"Expected at least {len(self.cart_items)} items, got {len(cart_items)}")
                        return False
                else:
                    self.log_test("Get Cart Items", False, "Invalid response format")
                    return False
            else:
                self.log_test("Get Cart Items", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Cart Items", False, f"Request failed: {str(e)}")
            return False

    def test_create_order(self):
        """Test POST /api/orders to create orders from cart items"""
        print("🧪 Testing Create Order...")
        
        order_data = {
            "session_id": SESSION_ID,
            "customer_name": "Emma Johnson",
            "customer_email": "emma.johnson@example.com",
            "shipping_address": "123 Fashion Street, Style City, SC 12345"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orders", json=order_data)
            
            if response.status_code == 200:
                order = response.json()
                required_fields = ['id', 'session_id', 'items', 'total_amount', 'customer_name', 'customer_email', 'shipping_address']
                missing_fields = [field for field in required_fields if field not in order]
                
                if not missing_fields:
                    if order['items'] and order['total_amount'] > 0:
                        self.log_test("Create Order", True, f"Order created with ID: {order['id']}, Total: ${order['total_amount']}")
                        return True
                    else:
                        self.log_test("Create Order", False, "Order has no items or zero total")
                        return False
                else:
                    self.log_test("Create Order", False, f"Missing order fields: {missing_fields}")
                    return False
            else:
                self.log_test("Create Order", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Order", False, f"Request failed: {str(e)}")
            return False

    def run_enhanced_test_suite(self):
        """Run the complete enhanced StyleHub API test suite"""
        print(f"🚀 Starting Comprehensive StyleHub Enhanced API Testing")
        print(f"📍 Backend URL: {API_BASE}")
        print(f"🔑 Session ID: {SESSION_ID}")
        print("=" * 80)
        
        # Enhanced test sequence
        test_sequence = [
            # Enhanced initialization
            ("Enhanced Initialize Sample Data", self.test_enhanced_init_data),
            
            # Enhanced products
            ("Get Enhanced Products", self.test_get_enhanced_products),
            
            # Brand management
            ("Get All Brands", self.test_get_all_brands),
            ("Individual Brand Retrieval", self.test_get_individual_brand),
            ("Brand Products", self.test_get_brand_products),
            
            # Enhanced search
            ("Enhanced Search API", self.test_enhanced_search_api),
            ("Search Suggestions", self.test_search_suggestions),
            ("Trending Products", self.test_trending_products),
            
            # User activity and recommendations
            ("Product Activity Tracking", self.test_product_activity_tracking),
            ("Individual Product Retrieval", self.test_get_individual_product),  # This tracks activity
            ("Personalized Recommendations", self.test_personalized_recommendations),
            ("Recently Viewed Products", self.test_recently_viewed_products),
            
            # Review system
            ("Create Product Review", self.test_create_product_review),
            ("Get Product Reviews", self.test_get_product_reviews),
            ("Mark Review Helpful", self.test_mark_review_helpful),
            
            # Basic ecommerce workflow
            ("Category Filtering", self.test_get_products_by_category),
            ("Featured Products", self.test_get_featured_products),
            ("Add to Cart", self.test_add_to_cart),
            ("Get Cart Items", self.test_get_cart),
            ("Create Order", self.test_create_order),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in test_sequence:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_name}: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print("=" * 80)
        print("📊 ENHANCED STYLEHUB API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = passed + failed
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL ENHANCED TESTS PASSED! The StyleHub enhanced backend API is working correctly.")
            print("✨ Enhanced features tested: Search, Brands, Reviews, Recommendations, Activity Tracking")
        else:
            print(f"\n⚠️  {failed} CRITICAL ISSUES FOUND in enhanced features.")
            print("🔧 These issues need immediate attention from the development team.")
        
        print("\n📋 Detailed Test Results:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details'] and not result['success']:
                print(f"   Issue: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = StyleHubEnhancedAPITester()
    success = tester.run_enhanced_test_suite()
    sys.exit(0 if success else 1)