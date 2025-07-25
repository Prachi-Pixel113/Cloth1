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

    # ========== SALES SECTION TESTS ==========
    def test_sales_products_endpoint_basic(self):
        """Test GET /api/products/sale endpoint basic functionality"""
        print("🧪 Testing Sales Products Endpoint (Basic)...")
        
        try:
            response = self.session.get(f"{API_BASE}/products/sale")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        # Verify all products have discount_percentage > 0
                        all_have_discount = all(
                            p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                            for p in products
                        )
                        if all_have_discount:
                            self.log_test("Sales Products (Basic)", True, f"Found {len(products)} sale products, all with discounts > 0")
                            return True
                        else:
                            self.log_test("Sales Products (Basic)", False, "Some products don't have discount_percentage > 0")
                            return False
                    else:
                        self.log_test("Sales Products (Basic)", True, "No sale products found (valid if no discounted products exist)")
                        return True
                else:
                    self.log_test("Sales Products (Basic)", False, "Invalid response format")
                    return False
            else:
                self.log_test("Sales Products (Basic)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Products (Basic)", False, f"Request failed: {str(e)}")
            return False

    def test_sales_products_category_filter(self):
        """Test GET /api/products/sale with category filtering"""
        print("🧪 Testing Sales Products Category Filtering...")
        
        # Test both men's and women's categories
        categories_to_test = ["mens_shirts", "mens_tshirts", "womens_dresses", "womens_tops"]
        
        for category in categories_to_test:
            try:
                response = self.session.get(f"{API_BASE}/products/sale", params={"category": category})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            # Verify all products match category and have discounts
                            all_correct_category = all(p.get('category') == category for p in products)
                            all_have_discount = all(
                                p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                                for p in products
                            )
                            
                            if all_correct_category and all_have_discount:
                                self.log_test(f"Sales Category Filter ({category})", True, f"Found {len(products)} sale products in {category}")
                            else:
                                if not all_correct_category:
                                    self.log_test(f"Sales Category Filter ({category})", False, f"Some products don't match {category}")
                                else:
                                    self.log_test(f"Sales Category Filter ({category})", False, "Some products don't have discounts")
                                return False
                        else:
                            self.log_test(f"Sales Category Filter ({category})", True, f"No sale products in {category} (valid)")
                    else:
                        self.log_test(f"Sales Category Filter ({category})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Sales Category Filter ({category})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Sales Category Filter ({category})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_sales_products_brand_filter(self):
        """Test GET /api/products/sale with brand filtering"""
        print("🧪 Testing Sales Products Brand Filtering...")
        
        if not self.sample_brands:
            self.log_test("Sales Brand Filter", False, "No sample brands available for testing")
            return False
        
        # Test with first available brand
        brand_id = self.sample_brands[0]['id']
        
        try:
            response = self.session.get(f"{API_BASE}/products/sale", params={"brand_id": brand_id})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        # Verify all products belong to the brand and have discounts
                        all_correct_brand = all(p.get('brand_id') == brand_id for p in products)
                        all_have_discount = all(
                            p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                            for p in products
                        )
                        
                        if all_correct_brand and all_have_discount:
                            self.log_test("Sales Brand Filter", True, f"Found {len(products)} sale products for brand")
                        else:
                            if not all_correct_brand:
                                self.log_test("Sales Brand Filter", False, "Some products don't belong to the requested brand")
                            else:
                                self.log_test("Sales Brand Filter", False, "Some products don't have discounts")
                            return False
                    else:
                        self.log_test("Sales Brand Filter", True, "No sale products found for brand (valid)")
                else:
                    self.log_test("Sales Brand Filter", False, "Invalid response format")
                    return False
            else:
                self.log_test("Sales Brand Filter", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Brand Filter", False, f"Request failed: {str(e)}")
            return False
        
        return True

    def test_sales_products_price_filter(self):
        """Test GET /api/products/sale with price range filtering"""
        print("🧪 Testing Sales Products Price Filtering...")
        
        price_ranges = [
            {"min_price": 20.0, "max_price": 60.0, "name": "Budget Range"},
            {"min_price": 60.0, "max_price": 120.0, "name": "Mid Range"},
            {"min_price": 120.0, "name": "Premium Range"}
        ]
        
        for price_range in price_ranges:
            try:
                params = {}
                if "min_price" in price_range:
                    params["min_price"] = price_range["min_price"]
                if "max_price" in price_range:
                    params["max_price"] = price_range["max_price"]
                
                response = self.session.get(f"{API_BASE}/products/sale", params=params)
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            # Verify all products are within price range and have discounts
                            valid_prices = True
                            all_have_discount = True
                            
                            for product in products:
                                price = product.get('price', 0)
                                discount = product.get('discount_percentage', 0)
                                
                                if "min_price" in price_range and price < price_range["min_price"]:
                                    valid_prices = False
                                    break
                                if "max_price" in price_range and price > price_range["max_price"]:
                                    valid_prices = False
                                    break
                                if discount is None or discount <= 0:
                                    all_have_discount = False
                                    break
                            
                            if valid_prices and all_have_discount:
                                self.log_test(f"Sales Price Filter ({price_range['name']})", True, f"Found {len(products)} sale products in price range")
                            else:
                                if not valid_prices:
                                    self.log_test(f"Sales Price Filter ({price_range['name']})", False, "Some products outside price range")
                                else:
                                    self.log_test(f"Sales Price Filter ({price_range['name']})", False, "Some products don't have discounts")
                                return False
                        else:
                            self.log_test(f"Sales Price Filter ({price_range['name']})", True, f"No sale products in {price_range['name']} (valid)")
                    else:
                        self.log_test(f"Sales Price Filter ({price_range['name']})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Sales Price Filter ({price_range['name']})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Sales Price Filter ({price_range['name']})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_sales_products_min_discount_filter(self):
        """Test GET /api/products/sale with minimum discount filtering"""
        print("🧪 Testing Sales Products Minimum Discount Filtering...")
        
        discount_thresholds = [10.0, 20.0, 30.0]
        
        for min_discount in discount_thresholds:
            try:
                response = self.session.get(f"{API_BASE}/products/sale", params={"min_discount": min_discount})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            # Verify all products have discount >= min_discount
                            all_meet_threshold = all(
                                p.get('discount_percentage') is not None and p.get('discount_percentage') >= min_discount 
                                for p in products
                            )
                            
                            if all_meet_threshold:
                                self.log_test(f"Sales Min Discount Filter ({min_discount}%)", True, f"Found {len(products)} products with discount >= {min_discount}%")
                            else:
                                self.log_test(f"Sales Min Discount Filter ({min_discount}%)", False, f"Some products have discount < {min_discount}%")
                                return False
                        else:
                            self.log_test(f"Sales Min Discount Filter ({min_discount}%)", True, f"No products with discount >= {min_discount}% (valid)")
                    else:
                        self.log_test(f"Sales Min Discount Filter ({min_discount}%)", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Sales Min Discount Filter ({min_discount}%)", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Sales Min Discount Filter ({min_discount}%)", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_sales_products_sorting(self):
        """Test GET /api/products/sale with different sorting options"""
        print("🧪 Testing Sales Products Sorting...")
        
        sort_options = ["discount_high", "discount_low", "price_low", "price_high", "rating", "newest", "popularity"]
        
        for sort_by in sort_options:
            try:
                response = self.session.get(f"{API_BASE}/products/sale", params={"sort_by": sort_by, "limit": 10})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if len(products) >= 2:
                            # Verify sorting is working and all have discounts
                            sorted_correctly = True
                            all_have_discount = all(
                                p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                                for p in products
                            )
                            
                            if not all_have_discount:
                                self.log_test(f"Sales Sorting ({sort_by})", False, "Some products don't have discounts")
                                return False
                            
                            for i in range(len(products) - 1):
                                current = products[i]
                                next_product = products[i + 1]
                                
                                if sort_by == "discount_high":
                                    if current.get('discount_percentage', 0) < next_product.get('discount_percentage', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "discount_low":
                                    if current.get('discount_percentage', 0) > next_product.get('discount_percentage', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "price_low":
                                    if current.get('price', 0) > next_product.get('price', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "price_high":
                                    if current.get('price', 0) < next_product.get('price', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "rating":
                                    if current.get('average_rating', 0) < next_product.get('average_rating', 0):
                                        sorted_correctly = False
                                        break
                            
                            if sorted_correctly:
                                self.log_test(f"Sales Sorting ({sort_by})", True, f"Sale products sorted correctly by {sort_by}")
                            else:
                                self.log_test(f"Sales Sorting ({sort_by})", False, f"Sale products not sorted correctly by {sort_by}")
                                return False
                        else:
                            self.log_test(f"Sales Sorting ({sort_by})", True, f"Insufficient sale products to verify {sort_by} sorting (valid)")
                    else:
                        self.log_test(f"Sales Sorting ({sort_by})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Sales Sorting ({sort_by})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Sales Sorting ({sort_by})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_sales_products_pagination(self):
        """Test GET /api/products/sale with limit and skip parameters"""
        print("🧪 Testing Sales Products Pagination...")
        
        try:
            # Test limit parameter
            response = self.session.get(f"{API_BASE}/products/sale", params={"limit": 5})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if len(products) <= 5:
                        all_have_discount = all(
                            p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                            for p in products
                        )
                        if all_have_discount:
                            self.log_test("Sales Pagination (Limit)", True, f"Limit parameter working, got {len(products)} products")
                        else:
                            self.log_test("Sales Pagination (Limit)", False, "Some products don't have discounts")
                            return False
                    else:
                        self.log_test("Sales Pagination (Limit)", False, f"Expected max 5 products, got {len(products)}")
                        return False
                else:
                    self.log_test("Sales Pagination (Limit)", False, "Invalid response format")
                    return False
            else:
                self.log_test("Sales Pagination (Limit)", False, f"HTTP {response.status_code}: {response.text}")
                return False
            
            # Test skip parameter
            response = self.session.get(f"{API_BASE}/products/sale", params={"limit": 3, "skip": 2})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if len(products) <= 3:
                        all_have_discount = all(
                            p.get('discount_percentage') is not None and p.get('discount_percentage') > 0 
                            for p in products
                        )
                        if all_have_discount:
                            self.log_test("Sales Pagination (Skip)", True, f"Skip parameter working, got {len(products)} products")
                        else:
                            self.log_test("Sales Pagination (Skip)", False, "Some products don't have discounts")
                            return False
                    else:
                        self.log_test("Sales Pagination (Skip)", False, f"Expected max 3 products, got {len(products)}")
                        return False
                else:
                    self.log_test("Sales Pagination (Skip)", False, "Invalid response format")
                    return False
            else:
                self.log_test("Sales Pagination (Skip)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Pagination", False, f"Request failed: {str(e)}")
            return False
        
        return True

    def test_sales_products_response_format(self):
        """Test that sales products response matches Product model format"""
        print("🧪 Testing Sales Products Response Format...")
        
        try:
            response = self.session.get(f"{API_BASE}/products/sale", params={"limit": 1})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and products:
                    product = products[0]
                    
                    # Check required Product model fields
                    required_fields = ['id', 'name', 'description', 'price', 'category', 'sizes', 'colors', 'stock_quantity', 'discount_percentage']
                    optional_fields = ['brand_id', 'brand_name', 'tags', 'materials', 'average_rating', 'review_count', 'view_count', 'featured']
                    
                    missing_required = [field for field in required_fields if field not in product]
                    present_optional = [field for field in optional_fields if field in product]
                    
                    # Verify discount_percentage > 0
                    discount = product.get('discount_percentage')
                    has_valid_discount = discount is not None and discount > 0
                    
                    if not missing_required and has_valid_discount:
                        self.log_test("Sales Response Format", True, f"Product model format correct, has {len(present_optional)} optional fields, discount: {discount}%")
                        return True
                    else:
                        if missing_required:
                            self.log_test("Sales Response Format", False, f"Missing required fields: {missing_required}")
                        else:
                            self.log_test("Sales Response Format", False, f"Invalid discount_percentage: {discount}")
                        return False
                else:
                    self.log_test("Sales Response Format", True, "No sale products to verify format (valid)")
                    return True
            else:
                self.log_test("Sales Response Format", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Response Format", False, f"Request failed: {str(e)}")
            return False

    # ========== EXISTING API COMPATIBILITY TESTS ==========
    def test_existing_products_endpoint(self):
        """Test that existing /api/products endpoint still works correctly"""
        print("🧪 Testing Existing Products Endpoint Compatibility...")
        
        try:
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    self.log_test("Existing Products Endpoint", True, f"Retrieved {len(products)} products successfully")
                    return True
                else:
                    self.log_test("Existing Products Endpoint", False, "Invalid response format")
                    return False
            else:
                self.log_test("Existing Products Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Existing Products Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_existing_womens_products_endpoint(self):
        """Test that existing /api/products/women endpoint still works correctly"""
        print("🧪 Testing Existing Women's Products Endpoint Compatibility...")
        
        try:
            response = self.session.get(f"{API_BASE}/products/women")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        womens_categories = ["womens_dresses", "womens_tops", "womens_blouses", "womens_skirts", 
                                           "womens_jeans", "womens_ethnic", "womens_formal", "womens_casual", "womens_sportswear"]
                        all_womens_products = all(p.get('category') in womens_categories for p in products)
                        
                        if all_womens_products:
                            self.log_test("Existing Women's Products Endpoint", True, f"Retrieved {len(products)} women's products successfully")
                        else:
                            self.log_test("Existing Women's Products Endpoint", False, "Some products are not women's categories")
                            return False
                    else:
                        self.log_test("Existing Women's Products Endpoint", True, "No women's products found (valid)")
                    return True
                else:
                    self.log_test("Existing Women's Products Endpoint", False, "Invalid response format")
                    return False
            else:
                self.log_test("Existing Women's Products Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Existing Women's Products Endpoint", False, f"Request failed: {str(e)}")
            return False

    # ========== MEN'S SECTION TESTS ==========
    def test_mens_products_endpoint(self):
        """Test GET /api/products/men endpoint with various filters"""
        print("🧪 Testing Men's Products Endpoint...")
        
        # Test 1: Get all men's products
        try:
            response = self.session.get(f"{API_BASE}/products/men")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    mens_categories = ["mens_shirts", "mens_tshirts", "mens_pants", "mens_jeans", 
                                     "mens_blazers", "mens_casual", "mens_formal", "mens_sportswear"]
                    
                    if products:
                        # Verify all products are men's categories
                        all_mens_products = all(p.get('category') in mens_categories for p in products)
                        if all_mens_products:
                            self.log_test("Men's Products (All)", True, f"Found {len(products)} men's products")
                        else:
                            self.log_test("Men's Products (All)", False, "Some products are not men's categories")
                            return False
                    else:
                        self.log_test("Men's Products (All)", True, "No men's products found (valid)")
                else:
                    self.log_test("Men's Products (All)", False, "Invalid response format")
                    return False
            else:
                self.log_test("Men's Products (All)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Men's Products (All)", False, f"Request failed: {str(e)}")
            return False
        
        return True

    def test_mens_products_category_filter(self):
        """Test GET /api/products/men with specific category filtering"""
        print("🧪 Testing Men's Products Category Filtering...")
        
        mens_categories_to_test = ["mens_shirts", "mens_tshirts", "mens_jeans", "mens_formal"]
        
        for category in mens_categories_to_test:
            try:
                response = self.session.get(f"{API_BASE}/products/men", params={"category": category})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            all_correct_category = all(p.get('category') == category for p in products)
                            if all_correct_category:
                                self.log_test(f"Men's Category Filter ({category})", True, f"Found {len(products)} products in {category}")
                            else:
                                self.log_test(f"Men's Category Filter ({category})", False, f"Some products don't match {category}")
                                return False
                        else:
                            self.log_test(f"Men's Category Filter ({category})", True, f"No products in {category} (valid)")
                    else:
                        self.log_test(f"Men's Category Filter ({category})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Men's Category Filter ({category})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Men's Category Filter ({category})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_mens_products_price_filter(self):
        """Test GET /api/products/men with price range filtering"""
        print("🧪 Testing Men's Products Price Filtering...")
        
        price_ranges = [
            {"min_price": 20.0, "max_price": 50.0, "name": "Budget Range"},
            {"min_price": 50.0, "max_price": 100.0, "name": "Mid Range"},
            {"min_price": 100.0, "name": "Premium Range"}
        ]
        
        for price_range in price_ranges:
            try:
                params = {}
                if "min_price" in price_range:
                    params["min_price"] = price_range["min_price"]
                if "max_price" in price_range:
                    params["max_price"] = price_range["max_price"]
                
                response = self.session.get(f"{API_BASE}/products/men", params=params)
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if products:
                            # Verify all products are within price range
                            valid_prices = True
                            for product in products:
                                price = product.get('price', 0)
                                if "min_price" in price_range and price < price_range["min_price"]:
                                    valid_prices = False
                                    break
                                if "max_price" in price_range and price > price_range["max_price"]:
                                    valid_prices = False
                                    break
                            
                            if valid_prices:
                                self.log_test(f"Men's Price Filter ({price_range['name']})", True, f"Found {len(products)} products in price range")
                            else:
                                self.log_test(f"Men's Price Filter ({price_range['name']})", False, "Some products outside price range")
                                return False
                        else:
                            self.log_test(f"Men's Price Filter ({price_range['name']})", True, f"No products in {price_range['name']} (valid)")
                    else:
                        self.log_test(f"Men's Price Filter ({price_range['name']})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Men's Price Filter ({price_range['name']})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Men's Price Filter ({price_range['name']})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_mens_products_sorting(self):
        """Test GET /api/products/men with different sorting options"""
        print("🧪 Testing Men's Products Sorting...")
        
        sort_options = ["featured", "price_low", "price_high", "popularity", "rating", "newest"]
        
        for sort_by in sort_options:
            try:
                response = self.session.get(f"{API_BASE}/products/men", params={"sort_by": sort_by, "limit": 10})
                
                if response.status_code == 200:
                    products = response.json()
                    if isinstance(products, list):
                        if len(products) >= 2:
                            # Verify sorting is working
                            sorted_correctly = True
                            for i in range(len(products) - 1):
                                current = products[i]
                                next_product = products[i + 1]
                                
                                if sort_by == "price_low":
                                    if current.get('price', 0) > next_product.get('price', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "price_high":
                                    if current.get('price', 0) < next_product.get('price', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "rating":
                                    if current.get('average_rating', 0) < next_product.get('average_rating', 0):
                                        sorted_correctly = False
                                        break
                                elif sort_by == "featured":
                                    # Featured products should come first
                                    if not current.get('featured', False) and next_product.get('featured', False):
                                        sorted_correctly = False
                                        break
                            
                            if sorted_correctly:
                                self.log_test(f"Men's Sorting ({sort_by})", True, f"Products sorted correctly by {sort_by}")
                            else:
                                self.log_test(f"Men's Sorting ({sort_by})", False, f"Products not sorted correctly by {sort_by}")
                                return False
                        else:
                            self.log_test(f"Men's Sorting ({sort_by})", True, f"Insufficient products to verify {sort_by} sorting (valid)")
                    else:
                        self.log_test(f"Men's Sorting ({sort_by})", False, "Invalid response format")
                        return False
                else:
                    self.log_test(f"Men's Sorting ({sort_by})", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test(f"Men's Sorting ({sort_by})", False, f"Request failed: {str(e)}")
                return False
        
        return True

    def test_mens_products_brand_filter(self):
        """Test GET /api/products/men with brand filtering"""
        print("🧪 Testing Men's Products Brand Filtering...")
        
        if not self.sample_brands:
            self.log_test("Men's Brand Filter", False, "No sample brands available for testing")
            return False
        
        # Test with first available brand
        brand_id = self.sample_brands[0]['id']
        
        try:
            response = self.session.get(f"{API_BASE}/products/men", params={"brand_id": brand_id})
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if products:
                        # Verify all products belong to the brand and are men's products
                        mens_categories = ["mens_shirts", "mens_tshirts", "mens_pants", "mens_jeans", 
                                         "mens_blazers", "mens_casual", "mens_formal", "mens_sportswear"]
                        
                        all_correct_brand = all(p.get('brand_id') == brand_id for p in products)
                        all_mens_products = all(p.get('category') in mens_categories for p in products)
                        
                        if all_correct_brand and all_mens_products:
                            self.log_test("Men's Brand Filter", True, f"Found {len(products)} men's products for brand")
                        else:
                            if not all_correct_brand:
                                self.log_test("Men's Brand Filter", False, "Some products don't belong to the requested brand")
                            else:
                                self.log_test("Men's Brand Filter", False, "Some products are not men's categories")
                            return False
                    else:
                        self.log_test("Men's Brand Filter", True, "No men's products found for brand (valid)")
                else:
                    self.log_test("Men's Brand Filter", False, "Invalid response format")
                    return False
            else:
                self.log_test("Men's Brand Filter", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Men's Brand Filter", False, f"Request failed: {str(e)}")
            return False
        
        return True

    def test_verify_mens_sample_data(self):
        """Verify that sample data includes men's products with correct categories"""
        print("🧪 Testing Men's Sample Data Verification...")
        
        try:
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 200:
                all_products = response.json()
                if isinstance(all_products, list):
                    mens_categories = ["mens_shirts", "mens_tshirts", "mens_pants", "mens_jeans", 
                                     "mens_blazers", "mens_casual", "mens_formal", "mens_sportswear"]
                    
                    # Count products in each men's category
                    category_counts = {}
                    for category in mens_categories:
                        category_counts[category] = len([p for p in all_products if p.get('category') == category])
                    
                    total_mens_products = sum(category_counts.values())
                    categories_with_products = [cat for cat, count in category_counts.items() if count > 0]
                    
                    if total_mens_products > 0:
                        details = f"Total men's products: {total_mens_products}, Categories with products: {len(categories_with_products)}"
                        for cat, count in category_counts.items():
                            if count > 0:
                                details += f", {cat}: {count}"
                        
                        self.log_test("Men's Sample Data Verification", True, details)
                        return True
                    else:
                        self.log_test("Men's Sample Data Verification", False, "No men's products found in sample data")
                        return False
                else:
                    self.log_test("Men's Sample Data Verification", False, "Invalid response format")
                    return False
            else:
                self.log_test("Men's Sample Data Verification", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Men's Sample Data Verification", False, f"Request failed: {str(e)}")
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
            
            # Men's Section Tests
            ("Men's Products Endpoint", self.test_mens_products_endpoint),
            ("Men's Category Filtering", self.test_mens_products_category_filter),
            ("Men's Price Filtering", self.test_mens_products_price_filter),
            ("Men's Sorting Options", self.test_mens_products_sorting),
            ("Men's Brand Filtering", self.test_mens_products_brand_filter),
            ("Men's Sample Data Verification", self.test_verify_mens_sample_data),
            
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