from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "user"
    
    id = Column(String, primary_key=True, default=generate_id)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "category"
    
    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    imageUrl = Column(String, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    votes = relationship("Vote", back_populates="category", cascade="all, delete-orphan")
    contestants = relationship("Contestant", back_populates="category", cascade="all, delete-orphan")

class Contestant(Base):
    __tablename__ = "contestant"
    
    id = Column(String, primary_key=True, default=generate_id)
    categoryId = Column(String, ForeignKey("category.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    picture = Column(String, nullable=True)  # URL to the picture
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    category = relationship("Category", back_populates="contestants")

class Vote(Base):
    __tablename__ = "vote"
    
    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=True)
    email = Column(String, nullable=True)
    categoryId = Column(String, ForeignKey("category.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="votes")
    category = relationship("Category", back_populates="votes")
    
    __table_args__ = (
        UniqueConstraint('userId', 'categoryId', name='userId_categoryId'),
        UniqueConstraint('email', 'categoryId', name='email_categoryId'),
    )

class ChatMessage(Base):
    __tablename__ = "chatmessage"
    
    id = Column(String, primary_key=True, default=generate_id)
    content = Column(String, nullable=False)
    userId = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="messages")

class Question(Base):
    __tablename__ = "question"
    
    id = Column(String, primary_key=True, default=generate_id)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    userId = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="questions")

