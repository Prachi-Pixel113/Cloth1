from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

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
    WOMENS_DRESSES = "womens_dresses"
    MENS_PANTS = "mens_pants"
    WOMENS_TOPS = "womens_tops"
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

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: ClothingCategory
    sizes: List[Size]
    colors: List[str]
    images: List[str]
    stock_quantity: int = 0
    featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: ClothingCategory
    sizes: List[Size]
    colors: List[str]
    images: List[str]
    stock_quantity: int = 0
    featured: bool = False

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
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[ClothingCategory] = None,
    featured: Optional[bool] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    filter_dict = {}
    if category:
        filter_dict["category"] = category
    if featured is not None:
        filter_dict["featured"] = featured
    
    products = await db.products.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

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
    
    sample_products = [
        {
            "name": "Classic White Shirt",
            "description": "Elegant white cotton shirt perfect for formal occasions and office wear",
            "price": 79.99,
            "category": "formal_wear",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["White", "Light Blue"],
            "images": ["https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 50,
            "featured": True
        },
        {
            "name": "Elegant Maroon Dress",
            "description": "Stunning maroon dress perfect for evening events and special occasions",
            "price": 129.99,
            "category": "womens_dresses",
            "sizes": ["XS", "S", "M", "L"],
            "colors": ["Maroon", "Black", "Navy"],
            "images": ["https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 30,
            "featured": True
        },
        {
            "name": "Casual Yellow Tracksuit",
            "description": "Comfortable yellow tracksuit ideal for casual outings and sports activities",
            "price": 89.99,
            "category": "sportswear",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Yellow", "Gray", "Black"],
            "images": ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWl8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 40,
            "featured": False
        },
        {
            "name": "Designer Denim Jeans",
            "description": "Premium quality denim jeans with perfect fit and modern styling",
            "price": 99.99,
            "category": "mens_pants",
            "sizes": ["M", "L", "XL", "XXL"],
            "colors": ["Blue", "Black", "Gray"],
            "images": ["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 60,
            "featured": True
        },
        {
            "name": "Stylish Summer Top",
            "description": "Light and breathable summer top perfect for warm weather",
            "price": 49.99,
            "category": "womens_tops",
            "sizes": ["XS", "S", "M", "L"],
            "colors": ["Pink", "White", "Mint Green"],
            "images": ["https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzUzMTI1NzQxfDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 35,
            "featured": False
        },
        {
            "name": "Professional Blazer",
            "description": "Sharp and sophisticated blazer for business meetings and formal events",
            "price": 159.99,
            "category": "formal_wear",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black", "Navy", "Charcoal"],
            "images": ["https://images.unsplash.com/photo-1562572159-4efc207f5aff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzUzMjQ2MTY0fDA&ixlib=rb-4.1.0&q=85"],
            "stock_quantity": 25,
            "featured": True
        }
    ]
    
    for product_data in sample_products:
        product_obj = Product(**product_data)
        await db.products.insert_one(product_obj.dict())
    
    return {"message": f"Initialized {len(sample_products)} sample products"}

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