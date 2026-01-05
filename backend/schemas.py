from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    role: str
    createdAt: datetime
    updatedAt: Optional[datetime]

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    createdAt: datetime
    updatedAt: Optional[datetime]

# Contestant schemas
class ContestantBase(BaseModel):
    name: str
    surname: str
    picture: Optional[str] = None

class ContestantCreate(ContestantBase):
    pass  # categoryId will be passed as URL parameter

class ContestantUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    picture: Optional[str] = None

class ContestantResponse(ContestantBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    categoryId: str
    createdAt: datetime
    updatedAt: Optional[datetime]

# Vote schemas
class VoteCreate(BaseModel):
    categoryId: str
    userId: Optional[str] = None
    email: Optional[EmailStr] = None

class VoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    userId: Optional[str]
    email: Optional[str]
    categoryId: str
    createdAt: datetime

# Message schemas
class MessageCreate(BaseModel):
    content: str
    userId: str

class UserInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    email: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    content: str
    userId: str
    createdAt: datetime
    user: UserInfo

# Question schemas
class QuestionCreate(BaseModel):
    title: str
    content: str
    userId: str

class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    content: str
    userId: str
    createdAt: datetime
    updatedAt: Optional[datetime]
    user: UserInfo

# Auth schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    message: str
    user: UserResponse
