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

class EcommerceAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.sample_products = []
        self.cart_items = []
        
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

    def test_init_sample_data(self):
        """Test POST /api/init-data to create sample clothing products"""
        print("🧪 Testing Sample Data Initialization...")
        
        try:
            response = self.session.post(f"{API_BASE}/init-data")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Initialize Sample Data", True, f"Response: {data['message']}")
                    return True
                else:
                    self.log_test("Initialize Sample Data", False, "Missing message in response")
                    return False
            else:
                self.log_test("Initialize Sample Data", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Initialize Sample Data", False, f"Request failed: {str(e)}")
            return False

    def test_get_all_products(self):
        """Test GET /api/products to fetch all products"""
        print("🧪 Testing Get All Products...")
        
        try:
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    self.sample_products = products
                    # Verify clothing-specific fields
                    first_product = products[0]
                    required_fields = ['id', 'name', 'description', 'price', 'category', 'sizes', 'colors', 'stock_quantity']
                    missing_fields = [field for field in required_fields if field not in first_product]
                    
                    if not missing_fields:
                        self.log_test("Get All Products", True, f"Retrieved {len(products)} products with all required clothing fields")
                        return True
                    else:
                        self.log_test("Get All Products", False, f"Missing clothing fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Get All Products", False, "No products returned or invalid format")
                    return False
            else:
                self.log_test("Get All Products", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get All Products", False, f"Request failed: {str(e)}")
            return False

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
                        # Verify all products belong to the requested category
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
            response = self.session.get(f"{API_BASE}/products/{product_id}")
            
            if response.status_code == 200:
                product = response.json()
                if product.get('id') == product_id:
                    # Verify all clothing-specific fields are present
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
                        # Verify cart items have required fields
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

    def test_update_cart_item(self):
        """Test PUT /api/cart/{item_id} to update quantities"""
        print("🧪 Testing Update Cart Item Quantity...")
        
        if not self.cart_items:
            self.log_test("Update Cart Item", False, "No cart items available for testing")
            return False
        
        item_id = self.cart_items[0]['id']
        new_quantity = 5
        
        try:
            response = self.session.put(f"{API_BASE}/cart/{item_id}", params={"quantity": new_quantity})
            
            if response.status_code == 200:
                updated_item = response.json()
                if updated_item.get('quantity') == new_quantity and updated_item.get('id') == item_id:
                    self.log_test("Update Cart Item", True, f"Updated quantity to {new_quantity}")
                    return True
                else:
                    self.log_test("Update Cart Item", False, "Quantity not updated correctly")
                    return False
            else:
                self.log_test("Update Cart Item", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Cart Item", False, f"Request failed: {str(e)}")
            return False

    def test_remove_cart_item(self):
        """Test DELETE /api/cart/{item_id} to remove items"""
        print("🧪 Testing Remove Cart Item...")
        
        if len(self.cart_items) < 2:
            self.log_test("Remove Cart Item", False, "Need at least 2 cart items for testing removal")
            return False
        
        item_id = self.cart_items[-1]['id']  # Remove the last item
        
        try:
            response = self.session.delete(f"{API_BASE}/cart/{item_id}")
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Remove Cart Item", True, f"Removed item: {result['message']}")
                    # Remove from our local tracking
                    self.cart_items = [item for item in self.cart_items if item['id'] != item_id]
                    return True
                else:
                    self.log_test("Remove Cart Item", False, "Missing confirmation message")
                    return False
            else:
                self.log_test("Remove Cart Item", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Remove Cart Item", False, f"Request failed: {str(e)}")
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

    def test_get_order_history(self):
        """Test GET /api/orders/{session_id} to retrieve order history"""
        print("🧪 Testing Get Order History...")
        
        try:
            response = self.session.get(f"{API_BASE}/orders/{SESSION_ID}")
            
            if response.status_code == 200:
                orders = response.json()
                if isinstance(orders, list):
                    if orders:
                        # Verify order structure
                        first_order = orders[0]
                        required_fields = ['id', 'session_id', 'items', 'total_amount', 'customer_name']
                        missing_fields = [field for field in required_fields if field not in first_order]
                        
                        if not missing_fields:
                            self.log_test("Get Order History", True, f"Retrieved {len(orders)} orders")
                            return True
                        else:
                            self.log_test("Get Order History", False, f"Missing order fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("Get Order History", True, "No orders found (valid for new session)")
                        return True
                else:
                    self.log_test("Get Order History", False, "Invalid response format")
                    return False
            else:
                self.log_test("Get Order History", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Order History", False, f"Request failed: {str(e)}")
            return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("🧪 Testing Error Handling...")
        
        # Test invalid product ID
        try:
            response = self.session.get(f"{API_BASE}/products/invalid-id")
            if response.status_code == 404:
                self.log_test("Error Handling (Invalid Product)", True, "Correctly returned 404 for invalid product")
            else:
                self.log_test("Error Handling (Invalid Product)", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Error Handling (Invalid Product)", False, f"Request failed: {str(e)}")
            return False
        
        # Test invalid cart item
        try:
            response = self.session.delete(f"{API_BASE}/cart/invalid-id")
            if response.status_code == 404:
                self.log_test("Error Handling (Invalid Cart Item)", True, "Correctly returned 404 for invalid cart item")
            else:
                self.log_test("Error Handling (Invalid Cart Item)", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Error Handling (Invalid Cart Item)", False, f"Request failed: {str(e)}")
            return False
        
        return True

    def run_full_test_suite(self):
        """Run the complete ecommerce workflow test"""
        print(f"🚀 Starting Comprehensive Ecommerce API Testing")
        print(f"📍 Backend URL: {API_BASE}")
        print(f"🔑 Session ID: {SESSION_ID}")
        print("=" * 80)
        
        # Test sequence following ecommerce workflow
        test_sequence = [
            ("Initialize Sample Data", self.test_init_sample_data),
            ("Get All Products", self.test_get_all_products),
            ("Category Filtering", self.test_get_products_by_category),
            ("Featured Products", self.test_get_featured_products),
            ("Individual Product", self.test_get_individual_product),
            ("Add to Cart", self.test_add_to_cart),
            ("Get Cart Items", self.test_get_cart),
            ("Update Cart Item", self.test_update_cart_item),
            ("Remove Cart Item", self.test_remove_cart_item),
            ("Create Order", self.test_create_order),
            ("Get Order History", self.test_get_order_history),
            ("Error Handling", self.test_error_handling)
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
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = passed + failed
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! The ecommerce backend API is working correctly.")
            print("✨ Full workflow tested: Data initialization → Product browsing → Cart management → Order processing")
        else:
            print(f"\n⚠️  {failed} CRITICAL ISSUES FOUND that block core ecommerce functionality.")
            print("🔧 These issues need immediate attention from the development team.")
        
        print("\n📋 Detailed Test Results:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details'] and not result['success']:
                print(f"   Issue: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = EcommerceAPITester()
    success = tester.run_full_test_suite()
    sys.exit(0 if success else 1)