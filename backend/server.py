from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import re
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ClothingCategory(str, Enum):
    MENS_SHIRTS = "mens_shirts"
    MENS_TSHIRTS = "mens_tshirts"
    MENS_PANTS = "mens_pants"
    MENS_JEANS = "mens_jeans"
    MENS_BLAZERS = "mens_blazers"
    MENS_CASUAL = "mens_casual"
    MENS_FORMAL = "mens_formal"
    MENS_SPORTSWEAR = "mens_sportswear"
    WOMENS_DRESSES = "womens_dresses"
    WOMENS_TOPS = "womens_tops"
    WOMENS_BLOUSES = "womens_blouses"
    WOMENS_SKIRTS = "womens_skirts"
    WOMENS_JEANS = "womens_jeans"
    WOMENS_ETHNIC = "womens_ethnic"
    WOMENS_FORMAL = "womens_formal"
    WOMENS_CASUAL = "womens_casual"
    WOMENS_SPORTSWEAR = "womens_sportswear"
    CASUAL_WEAR = "casual_wear"
    FORMAL_WEAR = "formal_wear"
    SPORTSWEAR = "sportswear"

class Size(str, Enum):
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"

class ReviewRating(int, Enum):
    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5

# Enhanced Models
class Brand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo_url: str
    brand_story: str
    featured: bool = False
    founded_year: Optional[int] = None
    website_url: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_name: str
    user_email: str
    rating: ReviewRating
    title: str
    comment: str
    verified_purchase: bool = False
    helpful_count: int = 0
    images: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    product_id: str
    activity_type: str  # "view", "wishlist", "cart_add", "purchase"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    additional_data: Dict[str, Any] = Field(default_factory=dict)

class SearchSuggestion(BaseModel):
    query: str
    count: int
    category: Optional[str] = None

class TrendingProduct(BaseModel):
    product_id: str
    view_count: int
    purchase_count: int
    wishlist_count: int
    trend_score: float
    period: str  # "daily", "weekly", "monthly"

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: ClothingCategory
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    sizes: List[Size]
    colors: List[str]
    images: List[str]
    stock_quantity: int = 0
    featured: bool = False
    tags: List[str] = Field(default_factory=list)
    materials: List[str] = Field(default_factory=list)
    care_instructions: Optional[str] = None
    average_rating: float = 0.0
    review_count: int = 0
    view_count: int = 0
    purchase_count: int = 0
    wishlist_count: int = 0
    discount_percentage: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: ClothingCategory
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    sizes: List[Size]
    colors: List[str]
    images: List[str]
    stock_quantity: int = 0
    featured: bool = False
    tags: List[str] = Field(default_factory=list)
    materials: List[str] = Field(default_factory=list)
    care_instructions: Optional[str] = None
    discount_percentage: Optional[float] = None

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    size: Size
    color: str
    quantity: int = 1
    session_id: str

class CartItemCreate(BaseModel):
    product_id: str
    size: Size
    color: str
    quantity: int = 1
    session_id: str

class ReviewCreate(BaseModel):
    product_id: str
    user_name: str
    user_email: str
    rating: ReviewRating
    title: str
    comment: str
    images: List[str] = Field(default_factory=list)

class BrandCreate(BaseModel):
    name: str
    description: str
    logo_url: str
    brand_story: str
    featured: bool = False
    founded_year: Optional[int] = None
    website_url: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)

class SearchQuery(BaseModel):
    query: str
    category: Optional[ClothingCategory] = None
    brand_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sizes: List[Size] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)
    sort_by: Optional[str] = "relevance"  # relevance, price_low, price_high, rating, newest
    limit: int = 20
    skip: int = 0

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    items: List[dict]
    total_amount: float
    customer_name: str
    customer_email: str
    shipping_address: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    session_id: str
    customer_name: str
    customer_email: str
    shipping_address: str

# Product routes
@api_router.get("/products/men", response_model=List[Product])
async def get_mens_products(
    category: Optional[str] = None,
    brand_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "featured",
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    """Get men's products with filtering options"""
    filter_dict = {}
    
    # Filter by men's categories
    mens_categories = ["mens_shirts", "mens_tshirts", "mens_pants", "mens_jeans", 
                      "mens_blazers", "mens_casual", "mens_formal", "mens_sportswear"]
    
    if category and category in mens_categories:
        filter_dict["category"] = category
    else:
        filter_dict["category"] = {"$in": mens_categories}
    
    # Additional filters
    if brand_id:
        filter_dict["brand_id"] = brand_id
    
    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        filter_dict["price"] = price_filter
    
    # Sorting
    sort_criteria = []
    if sort_by == "price_low":
        sort_criteria.append(("price", 1))
    elif sort_by == "price_high":
        sort_criteria.append(("price", -1))
    elif sort_by == "rating":
        sort_criteria.append(("average_rating", -1))
    elif sort_by == "newest":
        sort_criteria.append(("created_at", -1))
    elif sort_by == "popularity":
        sort_criteria.append(("view_count", -1))
    else:  # featured
        sort_criteria.append(("featured", -1))
        sort_criteria.append(("average_rating", -1))
    
    cursor = db.products.find(filter_dict)
    for field, direction in sort_criteria:
        cursor = cursor.sort(field, direction)
    
    products = await cursor.skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[ClothingCategory] = None,
    featured: Optional[bool] = None,
    brand_id: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    filter_dict = {}
    if category:
        filter_dict["category"] = category
    if featured is not None:
        filter_dict["featured"] = featured
    if brand_id:
        filter_dict["brand_id"] = brand_id
    
    products = await db.products.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

# Enhanced search endpoint
@api_router.post("/products/search", response_model=List[Product])
async def search_products(search_query: SearchQuery):
    filter_dict = {}
    
    # Text search
    if search_query.query:
        filter_dict["$or"] = [
            {"name": {"$regex": search_query.query, "$options": "i"}},
            {"description": {"$regex": search_query.query, "$options": "i"}},
            {"tags": {"$in": [search_query.query]}},
            {"brand_name": {"$regex": search_query.query, "$options": "i"}}
        ]
    
    # Category filter
    if search_query.category:
        filter_dict["category"] = search_query.category
    
    # Brand filter
    if search_query.brand_id:
        filter_dict["brand_id"] = search_query.brand_id
    
    # Price range
    if search_query.min_price is not None or search_query.max_price is not None:
        price_filter = {}
        if search_query.min_price is not None:
            price_filter["$gte"] = search_query.min_price
        if search_query.max_price is not None:
            price_filter["$lte"] = search_query.max_price
        filter_dict["price"] = price_filter
    
    # Size filter
    if search_query.sizes:
        filter_dict["sizes"] = {"$in": search_query.sizes}
    
    # Color filter
    if search_query.colors:
        filter_dict["colors"] = {"$in": search_query.colors}
    
    # Sorting
    sort_criteria = []
    if search_query.sort_by == "price_low":
        sort_criteria.append(("price", 1))
    elif search_query.sort_by == "price_high":
        sort_criteria.append(("price", -1))
    elif search_query.sort_by == "rating":
        sort_criteria.append(("average_rating", -1))
    elif search_query.sort_by == "newest":
        sort_criteria.append(("created_at", -1))
    elif search_query.sort_by == "popularity":
        sort_criteria.append(("view_count", -1))
    else:  # relevance
        sort_criteria.append(("featured", -1))
        sort_criteria.append(("average_rating", -1))
    
    cursor = db.products.find(filter_dict)
    for field, direction in sort_criteria:
        cursor = cursor.sort(field, direction)
    
    products = await cursor.skip(search_query.skip).limit(search_query.limit).to_list(search_query.limit)
    return [Product(**product) for product in products]

@api_router.get("/products/suggestions")
async def get_search_suggestions(q: str = Query(..., min_length=2)):
    """Get search suggestions based on partial query"""
    suggestions = []
    
    # Product name suggestions
    name_regex = {"$regex": f"^{re.escape(q)}", "$options": "i"}
    products = await db.products.find(
        {"name": name_regex}, 
        {"name": 1, "_id": 0}
    ).limit(5).to_list(5)
    
    suggestions.extend([p["name"] for p in products])
    
    # Brand name suggestions
    brands = await db.brands.find(
        {"name": name_regex}, 
        {"name": 1, "_id": 0}
    ).limit(3).to_list(3)
    
    suggestions.extend([b["name"] for b in brands])
    
    # Remove duplicates and limit
    unique_suggestions = list(dict.fromkeys(suggestions))[:8]
    
    return {"suggestions": unique_suggestions}

@api_router.get("/products/trending", response_model=List[Product])
async def get_trending_products(
    period: str = Query(default="weekly", regex="^(daily|weekly|monthly)$"),
    limit: int = Query(default=10, le=50)
):
    """Get trending products based on view count and purchase activity"""
    # Calculate trending score based on recent activity
    sort_criteria = [("view_count", -1), ("purchase_count", -1), ("average_rating", -1)]
    
    products = await db.products.find({}).sort(sort_criteria).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/recommended/{session_id}", response_model=List[Product])
async def get_recommended_products(
    session_id: str,
    limit: int = Query(default=10, le=20)
):
    """Get personalized product recommendations based on user activity"""
    # Get user's recent activity
    recent_views = await db.user_activities.find({
        "session_id": session_id,
        "activity_type": "view"
    }).sort("timestamp", -1).limit(20).to_list(20)
    
    if not recent_views:
        # If no activity, return featured products
        products = await db.products.find({"featured": True}).limit(limit).to_list(limit)
        return [Product(**product) for product in products]
    
    # Get categories and brands from recent views
    viewed_product_ids = [activity["product_id"] for activity in recent_views]
    viewed_products = await db.products.find({"id": {"$in": viewed_product_ids}}).to_list(20)
    
    categories = [p["category"] for p in viewed_products]
    brand_ids = [p.get("brand_id") for p in viewed_products if p.get("brand_id")]
    
    # Find similar products
    filter_dict = {
        "id": {"$nin": viewed_product_ids},  # Exclude already viewed
        "$or": [
            {"category": {"$in": categories}},
            {"brand_id": {"$in": brand_ids}} if brand_ids else {}
        ]
    }
    
    # Remove empty conditions
    filter_dict["$or"] = [condition for condition in filter_dict["$or"] if condition]
    
    recommended_products = await db.products.find(filter_dict).sort([
        ("average_rating", -1),
        ("featured", -1),
        ("view_count", -1)
    ]).limit(limit).to_list(limit)
    
    return [Product(**product) for product in recommended_products]

@api_router.get("/products/recently-viewed/{session_id}", response_model=List[Product])
async def get_recently_viewed_products(
    session_id: str,
    limit: int = Query(default=10, le=20)
):
    """Get recently viewed products for a session"""
    recent_views = await db.user_activities.find({
        "session_id": session_id,
        "activity_type": "view"
    }).sort("timestamp", -1).limit(limit).to_list(limit)
    
    if not recent_views:
        return []
    
    product_ids = [activity["product_id"] for activity in recent_views]
    products = await db.products.find({"id": {"$in": product_ids}}).to_list(limit)
    
    # Maintain order from recent views
    product_dict = {p["id"]: p for p in products}
    ordered_products = [product_dict[pid] for pid in product_ids if pid in product_dict]
    
    return [Product(**product) for product in ordered_products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, session_id: Optional[str] = None):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Track product view
    if session_id:
        await track_user_activity(session_id, product_id, "view")
        # Update product view count
        await db.products.update_one(
            {"id": product_id},
            {"$inc": {"view_count": 1}}
        )
    
    return Product(**product)

# User Activity Tracking
async def track_user_activity(session_id: str, product_id: str, activity_type: str, additional_data: Dict[str, Any] = None):
    """Helper function to track user activities"""
    activity = UserActivity(
        session_id=session_id,
        product_id=product_id,
        activity_type=activity_type,
        additional_data=additional_data or {}
    )
    await db.user_activities.insert_one(activity.dict())

@api_router.post("/products/{product_id}/track-activity")
async def track_product_activity(
    product_id: str,
    session_id: str,
    activity_type: str,
    additional_data: Dict[str, Any] = None
):
    """Explicitly track user activity"""
    await track_user_activity(session_id, product_id, activity_type, additional_data)
    return {"message": "Activity tracked successfully"}

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate):
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_dict = product.dict()
    product_dict["id"] = product_id
    product_dict["created_at"] = existing_product["created_at"]
    
    await db.products.replace_one({"id": product_id}, product_dict)
    return Product(**product_dict)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Brand routes
@api_router.get("/brands", response_model=List[Brand])
async def get_brands(
    featured: Optional[bool] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    filter_dict = {}
    if featured is not None:
        filter_dict["featured"] = featured
    
    brands = await db.brands.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Brand(**brand) for brand in brands]

@api_router.get("/brands/{brand_id}", response_model=Brand)
async def get_brand(brand_id: str):
    brand = await db.brands.find_one({"id": brand_id})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return Brand(**brand)

@api_router.post("/brands", response_model=Brand)
async def create_brand(brand: BrandCreate):
    brand_dict = brand.dict()
    brand_obj = Brand(**brand_dict)
    await db.brands.insert_one(brand_obj.dict())
    return brand_obj

@api_router.get("/brands/{brand_id}/products", response_model=List[Product])
async def get_brand_products(
    brand_id: str,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    products = await db.products.find({"brand_id": brand_id}).skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

# Review routes
@api_router.get("/products/{product_id}/reviews", response_model=List[Review])
async def get_product_reviews(
    product_id: str,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    reviews = await db.reviews.find({"product_id": product_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Review(**review) for review in reviews]

@api_router.post("/products/{product_id}/reviews", response_model=Review)
async def create_review(product_id: str, review: ReviewCreate):
    # Verify product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review_dict = review.dict()
    review_dict["product_id"] = product_id
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(review_obj.dict())
    
    # Update product rating statistics
    await update_product_rating_stats(product_id)
    
    return review_obj

@api_router.put("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str):
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review marked as helpful"}

async def update_product_rating_stats(product_id: str):
    """Update product's average rating and review count"""
    # Calculate average rating
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "review_count": {"$sum": 1}
        }}
    ]
    
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        stats = result[0]
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "average_rating": round(stats["avg_rating"], 1),
                "review_count": stats["review_count"]
            }}
        )

@api_router.get("/reviews/recent", response_model=List[Review])
async def get_recent_reviews(limit: int = Query(default=10, le=50)):
    """Get recent reviews across all products"""
    reviews = await db.reviews.find({}).sort("created_at", -1).limit(limit).to_list(limit)
    return [Review(**review) for review in reviews]

# Cart routes
@api_router.get("/cart/{session_id}", response_model=List[CartItem])
async def get_cart(session_id: str):
    cart_items = await db.cart_items.find({"session_id": session_id}).to_list(100)
    return [CartItem(**item) for item in cart_items]

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(cart_item: CartItemCreate):
    # Check if item already exists in cart
    existing_item = await db.cart_items.find_one({
        "product_id": cart_item.product_id,
        "size": cart_item.size,
        "color": cart_item.color,
        "session_id": cart_item.session_id
    })
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + cart_item.quantity
        await db.cart_items.update_one(
            {"id": existing_item["id"]},
            {"$set": {"quantity": new_quantity}}
        )
        existing_item["quantity"] = new_quantity
        return CartItem(**existing_item)
    else:
        # Create new cart item
        cart_item_dict = cart_item.dict()
        cart_item_obj = CartItem(**cart_item_dict)
        await db.cart_items.insert_one(cart_item_obj.dict())
        return cart_item_obj

@api_router.put("/cart/{item_id}", response_model=CartItem)
async def update_cart_item(item_id: str, quantity: int):
    result = await db.cart_items.update_one(
        {"id": item_id},
        {"$set": {"quantity": quantity}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    cart_item = await db.cart_items.find_one({"id": item_id})
    return CartItem(**cart_item)

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str):
    result = await db.cart_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/session/{session_id}")
async def clear_cart(session_id: str):
    await db.cart_items.delete_many({"session_id": session_id})
    return {"message": "Cart cleared"}

# Order routes
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # Get cart items
    cart_items = await db.cart_items.find({"session_id": order.session_id}).to_list(100)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and prepare order items
    total_amount = 0
    order_items = []
    
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if product:
            item_total = product["price"] * cart_item["quantity"]
            total_amount += item_total
            order_items.append({
                "product_id": cart_item["product_id"],
                "product_name": product["name"],
                "size": cart_item["size"],
                "color": cart_item["color"],
                "quantity": cart_item["quantity"],
                "price": product["price"],
                "total": item_total
            })
    
    order_dict = order.dict()
    order_dict["items"] = order_items
    order_dict["total_amount"] = total_amount
    order_obj = Order(**order_dict)
    
    await db.orders.insert_one(order_obj.dict())
    
    # Clear cart after order
    await db.cart_items.delete_many({"session_id": order.session_id})
    
    return order_obj

@api_router.get("/orders/{session_id}", response_model=List[Order])
async def get_orders(session_id: str):
    orders = await db.orders.find({"session_id": session_id}).to_list(100)
    return [Order(**order) for order in orders]

# Initialize sample data
@api_router.post("/init-data")
async def initialize_sample_data():
    # Check if products already exist
    existing_products = await db.products.find().to_list(1)
    if existing_products:
        return {"message": "Sample data already exists"}
    
    # Initialize brands first
    sample_brands = [
        {
            "name": "StyleHub Premium",
            "description": "Premium quality fashion for the modern individual",
            "logo_url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&h=200&fit=crop",
            "brand_story": "Founded with a vision to bring premium quality fashion accessible to everyone, StyleHub Premium has been crafting exceptional clothing since 2020.",
            "featured": True,
            "founded_year": 2020,
            "website_url": "https://stylehub.com",
            "social_links": {
                "instagram": "@stylehubpremium",
                "facebook": "StyleHubPremium",
                "twitter": "@stylehub"
            }
        },
        {
            "name": "Urban Essence",
            "description": "Contemporary streetwear with urban flair",
            "logo_url": "https://images.unsplash.com/photo-1599503663134-67fb1c65d6c4?w=200&h=200&fit=crop",
            "brand_story": "Urban Essence captures the spirit of city life through contemporary designs that blend comfort with cutting-edge style.",
            "featured": True,
            "founded_year": 2018,
            "website_url": "https://urbanessence.com",
            "social_links": {
                "instagram": "@urbanessence",
                "facebook": "UrbanEssenceBrand"
            }
        },
        {
            "name": "Classic Heritage",
            "description": "Timeless elegance meets modern sophistication",
            "logo_url": "https://images.unsplash.com/photo-1594736797933-d0c6d8ae2e67?w=200&h=200&fit=crop",
            "brand_story": "Classic Heritage brings together traditional craftsmanship with contemporary design philosophy for the discerning customer.",
            "featured": False,
            "founded_year": 2015,
            "website_url": "https://classicheritage.com",
            "social_links": {
                "instagram": "@classicheritage",
                "facebook": "ClassicHeritageBrand",
                "twitter": "@classic_heritage"
            }
        },
        {
            "name": "SportFlow",
            "description": "Performance wear for active lifestyles",
            "logo_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
            "brand_story": "SportFlow is dedicated to creating high-performance activewear that empowers athletes and fitness enthusiasts to achieve their best.",
            "featured": True,
            "founded_year": 2019,
            "website_url": "https://sportflow.com",
            "social_links": {
                "instagram": "@sportflow",
                "facebook": "SportFlowOfficial",
                "twitter": "@sportflow"
            }
        }
    ]
    
    brand_objects = []
    for brand_data in sample_brands:
        brand_obj = Brand(**brand_data)
        await db.brands.insert_one(brand_obj.dict())
        brand_objects.append(brand_obj)
    
    # Now create enhanced products with brand associations
    sample_products = [
        {
            "name": "Classic White Formal Shirt",
            "description": "Elegant white cotton shirt perfect for formal occasions and office wear. Made with premium cotton blend for comfort and durability.",
            "price": 79.99,
            "category": "formal_wear",
            "brand_id": brand_objects[0].id,
            "brand_name": brand_objects[0].name,
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["White", "Light Blue", "Cream"],
            "images": ["https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 50,
            "featured": True,
            "tags": ["formal", "office", "classic", "cotton"],
            "materials": ["Cotton", "Polyester"],
            "care_instructions": "Machine wash cold, iron on medium heat",
            "average_rating": 4.5,
            "review_count": 125,
            "view_count": 1250,
            "purchase_count": 89,
            "discount_percentage": 15.0
        },
        {
            "name": "Elegant Maroon Evening Dress",
            "description": "Stunning maroon dress perfect for evening events and special occasions. Features sophisticated design with premium fabric.",
            "price": 129.99,
            "category": "womens_dresses",
            "brand_id": brand_objects[0].id,
            "brand_name": brand_objects[0].name,
            "sizes": ["XS", "S", "M", "L"],
            "colors": ["Maroon", "Black", "Navy", "Emerald"],
            "images": ["https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 30,
            "featured": True,
            "tags": ["evening", "formal", "elegant", "party"],
            "materials": ["Polyester", "Silk blend"],
            "care_instructions": "Dry clean only",
            "average_rating": 4.7,
            "review_count": 87,
            "view_count": 2100,
            "purchase_count": 156,
            "discount_percentage": 20.0
        },
        {
            "name": "Urban Tracksuit Set",
            "description": "Comfortable tracksuit ideal for casual outings and sports activities. Modern urban design with premium comfort.",
            "price": 89.99,
            "category": "sportswear",
            "brand_id": brand_objects[3].id,
            "brand_name": brand_objects[3].name,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Yellow", "Gray", "Black", "Navy"],
            "images": ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 40,
            "featured": False,
            "tags": ["casual", "sport", "comfort", "urban"],
            "materials": ["Cotton", "Polyester", "Elastane"],
            "care_instructions": "Machine wash warm, tumble dry low",
            "average_rating": 4.2,
            "review_count": 203,
            "view_count": 1800,
            "purchase_count": 267,
            "discount_percentage": 10.0
        },
        {
            "name": "Designer Denim Jeans",
            "description": "Premium quality denim jeans with perfect fit and modern styling. Crafted with attention to detail.",
            "price": 99.99,
            "category": "mens_pants",
            "brand_id": brand_objects[1].id,
            "brand_name": brand_objects[1].name,
            "sizes": ["M", "L", "XL", "XXL"],
            "colors": ["Blue", "Black", "Gray", "Dark Blue"],
            "images": ["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 60,
            "featured": True,
            "tags": ["denim", "casual", "classic", "everyday"],
            "materials": ["Denim", "Cotton", "Elastane"],
            "care_instructions": "Machine wash inside out, hang dry",
            "average_rating": 4.4,
            "review_count": 312,
            "view_count": 3200,
            "purchase_count": 445,
            "discount_percentage": 25.0
        },
        {
            "name": "Stylish Summer Top",
            "description": "Light and breathable summer top perfect for warm weather. Features modern cut and comfortable fit.",
            "price": 49.99,
            "category": "womens_tops",
            "brand_id": brand_objects[1].id,
            "brand_name": brand_objects[1].name,
            "sizes": ["XS", "S", "M", "L"],
            "colors": ["Pink", "White", "Mint Green", "Coral"],
            "images": ["https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 35,
            "featured": False,
            "tags": ["summer", "casual", "lightweight", "trendy"],
            "materials": ["Cotton", "Modal"],
            "care_instructions": "Machine wash cold, line dry",
            "average_rating": 4.3,
            "review_count": 156,
            "view_count": 2400,
            "purchase_count": 287,
            "discount_percentage": 30.0
        },
        {
            "name": "Professional Business Blazer",
            "description": "Sharp and sophisticated blazer for business meetings and formal events. Tailored for the modern professional.",
            "price": 159.99,
            "category": "formal_wear",
            "brand_id": brand_objects[2].id,
            "brand_name": brand_objects[2].name,
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black", "Navy", "Charcoal", "Brown"],
            "images": ["https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 25,
            "featured": True,
            "tags": ["business", "formal", "professional", "classic"],
            "materials": ["Wool", "Polyester", "Viscose"],
            "care_instructions": "Dry clean recommended",
            "average_rating": 4.6,
            "review_count": 98,
            "view_count": 1900,
            "purchase_count": 134,
            "discount_percentage": 18.0
        },
        # Additional Men's Products
        {
            "name": "Classic Navy Chinos",
            "description": "Comfortable and versatile navy chinos perfect for casual and semi-formal occasions. Tailored fit with premium cotton blend.",
            "price": 69.99,
            "category": "mens_pants",
            "brand_id": brand_objects[1].id,
            "brand_name": brand_objects[1].name,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Navy", "Khaki", "Black", "Olive"],
            "images": ["https://images.unsplash.com/photo-1605794432120-f4bb5dc9067d"],
            "stock_quantity": 45,
            "featured": True,
            "tags": ["casual", "chinos", "versatile", "cotton"],
            "materials": ["Cotton", "Elastane"],
            "care_instructions": "Machine wash cold, hang dry",
            "average_rating": 4.3,
            "review_count": 178,
            "view_count": 2800,
            "purchase_count": 234,
            "discount_percentage": 20.0
        },
        {
            "name": "Premium Cotton T-Shirt",
            "description": "Ultra soft premium cotton t-shirt with perfect fit and superior comfort. Essential wardrobe staple for every modern man.",
            "price": 29.99,
            "category": "mens_tshirts",
            "brand_id": brand_objects[1].id,
            "brand_name": brand_objects[1].name,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["White", "Black", "Gray", "Navy", "Olive"],
            "images": ["https://images.unsplash.com/photo-1661181475147-bbd20ef65781"],
            "stock_quantity": 80,
            "featured": False,
            "tags": ["basic", "cotton", "comfortable", "everyday"],
            "materials": ["100% Cotton"],
            "care_instructions": "Machine wash cold, tumble dry low",
            "average_rating": 4.5,
            "review_count": 342,
            "view_count": 4200,
            "purchase_count": 567,
            "discount_percentage": 15.0
        },
        {
            "name": "Striped Business Shirt",
            "description": "Professional striped dress shirt crafted from premium cotton. Perfect for business meetings and formal occasions with modern fit.",
            "price": 89.99,
            "category": "mens_shirts",
            "brand_id": brand_objects[0].id,
            "brand_name": brand_objects[0].name,
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black/White", "Blue/White", "Gray/White"],
            "images": ["https://images.unsplash.com/photo-1605794432120-f4bb5dc9067d"],
            "stock_quantity": 35,
            "featured": True,
            "tags": ["business", "striped", "professional", "cotton"],
            "materials": ["Cotton", "Polyester"],
            "care_instructions": "Machine wash cold, iron medium heat",
            "average_rating": 4.4,
            "review_count": 89,
            "view_count": 1600,
            "purchase_count": 123,
            "discount_percentage": 25.0
        },
        {
            "name": "Casual Orange Sweater",
            "description": "Cozy and stylish orange sweater perfect for casual outings and weekend wear. Soft knit fabric with contemporary design.",
            "price": 79.99,
            "category": "mens_casual",
            "brand_id": brand_objects[1].id,
            "brand_name": brand_objects[1].name,
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Orange", "Navy", "Gray", "Forest Green"],
            "images": ["https://images.unsplash.com/photo-1637868841955-4a1dfb0a1545"],
            "stock_quantity": 28,
            "featured": False,
            "tags": ["casual", "sweater", "comfortable", "trendy"],
            "materials": ["Wool", "Cotton blend"],
            "care_instructions": "Hand wash or dry clean",
            "average_rating": 4.2,
            "review_count": 67,
            "view_count": 1200,
            "purchase_count": 89,
            "discount_percentage": 30.0
        },
        {
            "name": "Professional White Dress Shirt",
            "description": "Crisp white dress shirt with impeccable tailoring. Essential for every professional wardrobe with classic fit and premium quality.",
            "price": 79.99,
            "category": "mens_formal",
            "brand_id": brand_objects[2].id,
            "brand_name": brand_objects[2].name,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["White", "Light Blue", "Cream"],
            "images": ["https://images.unsplash.com/photo-1617724748068-691efeeaf542"],
            "stock_quantity": 55,
            "featured": True,
            "tags": ["formal", "professional", "classic", "white"],
            "materials": ["Cotton", "Polyester"],
            "care_instructions": "Machine wash cold, iron high heat",
            "average_rating": 4.6,
            "review_count": 156,
            "view_count": 2100,
            "purchase_count": 201,
            "discount_percentage": 18.0
        },
        {
            "name": "Athletic Performance Shorts",
            "description": "High-performance athletic shorts designed for intensive workouts and sports activities. Moisture-wicking fabric with flexible fit.",
            "price": 45.99,
            "category": "mens_sportswear",
            "brand_id": brand_objects[3].id,
            "brand_name": brand_objects[3].name,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Black", "Navy", "Gray", "Red"],
            "images": ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"],
            "stock_quantity": 65,
            "featured": False,
            "tags": ["athletic", "performance", "shorts", "moisture-wicking"],
            "materials": ["Polyester", "Elastane"],
            "care_instructions": "Machine wash cold, air dry",
            "average_rating": 4.3,
            "review_count": 234,
            "view_count": 1800,
            "purchase_count": 345,
            "discount_percentage": 22.0
        }
    ]
    
    for product_data in sample_products:
        product_obj = Product(**product_data)
        await db.products.insert_one(product_obj.dict())
    
    # Initialize some sample reviews
    sample_reviews = [
        {
            "product_id": sample_products[0]["name"],  # We'll need to get the actual ID
            "user_name": "Sarah Johnson",
            "user_email": "sarah.j@email.com",
            "rating": 5,
            "title": "Perfect fit and quality!",
            "comment": "This shirt exceeded my expectations. The material is high quality and the fit is perfect. Great for office wear.",
            "verified_purchase": True,
            "helpful_count": 12
        },
        {
            "product_id": sample_products[1]["name"],
            "user_name": "Emily Chen", 
            "user_email": "emily.c@email.com",
            "rating": 5,
            "title": "Absolutely stunning dress",
            "comment": "Wore this to a wedding and received so many compliments. The color is gorgeous and the fit is flattering.",
            "verified_purchase": True,
            "helpful_count": 8
        }
    ]
    
    return {"message": f"Initialized {len(sample_brands)} brands and {len(sample_products)} products"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()