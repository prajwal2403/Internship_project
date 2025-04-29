from fastapi import FastAPI, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr, Field, validator
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from bson.errors import InvalidId
import os
import base64

# Generate secure random keys
def generate_secret_key():
    return base64.urlsafe_b64encode(os.urandom(32)).decode()

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_DETAILS = "mongodb+srv://prajwal2403:Mysql321@prajwal2403.s8a1j.mongodb.net/Finance?retryWrites=true&w=majority"

# Initialize MongoDB client and collections
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.Finance
transactions_collection = database.get_collection("transactions")
users_collection = database.get_collection("users")

# Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", generate_secret_key()),
    session_cookie="session",
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = generate_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Helper functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"],
        "phone_number": user.get("phone_number")
    }

async def verify_transaction_owner(transaction_id: str, user_email: str):
    user = await users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        transaction = await transactions_collection.find_one(
            {"_id": ObjectId(transaction_id)}
        )
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    
    return transaction
async def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = token.split(" ")[1]  # Remove "Bearer "
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# Models
class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be a positive number")
    description: Optional[str] = Field(None, max_length=200, description="Max length is 200 characters")
    date: datetime = Field(..., description="Date cannot be in the future")
    category: Optional[str] = None

    @validator("date")
    def validate_date(cls, value):
        if value > datetime.now():
            raise ValueError("Date cannot be in the future")
        return value

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone_number: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")  # Updated to use `pattern`
    
class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None

# Routes
@app.post("/signup/", response_model=UserResponse)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    
    # Check if email already exists
    if await users_collection.find_one({"email": user_dict["email"]}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    user_dict["password"] = get_password_hash(user_dict["password"])
    
    # Insert user and return response
    new_user = await users_collection.insert_one(user_dict)
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})
    return user_helper(created_user)

@app.post("/login", response_model=Token)
async def login(form_data: UserLogin):
    user = await users_collection.find_one({"email": form_data.email})
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=UserResponse)
async def read_users_me(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)

@app.post("/transactions/", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate, email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transaction_data = transaction.dict()
    transaction_data["user_id"] = str(user["_id"])  # Map transaction to user
    transaction_data["created_at"] = datetime.utcnow()
    
    result = await transactions_collection.insert_one(transaction_data)
    created_transaction = await transactions_collection.find_one({"_id": result.inserted_id})
    created_transaction["id"] = str(created_transaction["_id"])
    return created_transaction

@app.get("/transactions/", response_model=List[TransactionResponse])
async def read_transactions(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = []
    # Only find transactions for this specific user
    async for tx in transactions_collection.find({"user_id": str(user["_id"])}).sort("date", -1):
        tx["id"] = str(tx["_id"])
        transactions.append(tx)
    return transactions     

@app.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def read_transaction(transaction_id: str, email: str):
    transaction = await verify_transaction_owner(transaction_id, email)
    transaction["id"] = str(transaction["_id"])
    return transaction

@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(transaction_id: str, transaction: TransactionCreate, email: str):
    # First verify the transaction belongs to the user
    existing_transaction = await verify_transaction_owner(transaction_id, email)
    
    transaction_data = transaction.dict(exclude_unset=True)
    transaction_data["updated_at"] = datetime.utcnow()
    
    await transactions_collection.update_one(
        {"_id": ObjectId(transaction_id)},
        {"$set": transaction_data}
    )
    
    updated_transaction = await transactions_collection.find_one({"_id": ObjectId(transaction_id)})
    updated_transaction["id"] = str(updated_transaction["_id"])
    return updated_transaction

@app.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, email: str):
    # First verify the transaction belongs to the user
    await verify_transaction_owner(transaction_id, email)
    
    result = await transactions_collection.delete_one(
        {"_id": ObjectId(transaction_id)}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

@app.get("/transactions/monthly-expenses")
async def get_monthly_expenses(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pipeline = [
        {"$match": {"user_id": str(user["_id"])}},  # Only aggregate for this user
        {
            "$group": {
                "_id": {"month": {"$month": "$date"}, "year": {"$year": "$date"}},
                "total": {"$sum": "$amount"}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    expenses = await transactions_collection.aggregate(pipeline).to_list(length=12)
    return [{"month": f"{e['_id']['year']}-{e['_id']['month']:02d}", "total": e["total"]} for e in expenses]

# New endpoint for category-wise spending
@app.get("/transactions/category-spending")
async def get_category_spending(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pipeline = [
        {"$match": {"user_id": str(user["_id"])}},  # Only aggregate for this user
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"total": -1}}
    ]
    categories = await transactions_collection.aggregate(pipeline).to_list(None)
    return [{"category": c["_id"], "total": c["total"], "count": c["count"]} for c in categories]

# New endpoint for recent spending trends
@app.get("/transactions/recent-spending")
async def get_recent_spending(email: str, days: int = 30):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "user_id": str(user["_id"]),
                "date": {"$gte": cutoff_date}
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                "total": {"$sum": "$amount"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_spending = await transactions_collection.aggregate(pipeline).to_list(None)
    return [{"date": d["_id"], "amount": d["total"]} for d in daily_spending]

@app.get("/transactions/user/{user_id}", response_model=List[TransactionResponse])
async def get_transactions_by_user(user_id: str):
    try:
        # Validate the user_id as a valid ObjectId
        user_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Check if the user exists
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Retrieve all transactions for the user
    transactions = []
    async for tx in transactions_collection.find({"user_id": user_id}).sort("date", -1):
        tx["id"] = str(tx["_id"])
        transactions.append(tx)

    return transactions