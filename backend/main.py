from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db, engine, Base
from models import User, Category, Vote, ChatMessage, Question, Contestant
from schemas import (
    UserCreate, UserResponse, LoginRequest, LoginResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ContestantCreate, ContestantUpdate, ContestantResponse,
    VoteCreate, VoteResponse,
    MessageCreate, MessageResponse,
    QuestionCreate, QuestionResponse
)
from auth import get_user_by_email, verify_password, create_user

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Youth Connect API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
@app.post("/api/auth/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    db_user = create_user(db, user)
    return {"message": "User created successfully", "userId": db_user.id}

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_dict = UserResponse.from_orm(user).dict()
    return LoginResponse(message="Login successful", user=user_dict)

# Category routes
@app.get("/api/categories", response_model=list[CategoryResponse])
async def get_categories(all: bool = False, db: Session = Depends(get_db)):
    query = db.query(Category)
    if not all:
        query = query.filter(Category.isActive == True)
    
    categories = query.order_by(Category.createdAt.desc()).all()
    result = []
    for cat in categories:
        vote_count = db.query(func.count(Vote.id)).filter(Vote.categoryId == cat.id).scalar()
        cat_dict = CategoryResponse.model_validate(cat).model_dump()
        cat_dict['_count'] = {'votes': vote_count}
        result.append(cat_dict)
    return result

@app.post("/api/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return CategoryResponse.model_validate(db_category).model_dump()

@app.patch("/api/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return CategoryResponse.model_validate(db_category).model_dump()

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: str, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}

# Vote routes
@app.get("/api/votes", response_model=list[VoteResponse])
async def get_votes(userId: Optional[str] = None, email: Optional[str] = None, db: Session = Depends(get_db)):
    if not userId and not email:
        raise HTTPException(status_code=400, detail="User ID or Email is required")
    
    query = db.query(Vote)
    if userId:
        query = query.filter(Vote.userId == userId)
    else:
        query = query.filter(Vote.email == email)
    
    votes = query.all()
    return [VoteResponse.model_validate(vote).model_dump() for vote in votes]

@app.post("/api/votes", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
async def create_vote(vote: VoteCreate, db: Session = Depends(get_db)):
    if not vote.userId and not vote.email:
        raise HTTPException(status_code=400, detail="User ID or Email is required")
    
    # Check if vote exists
    query = db.query(Vote).filter(Vote.categoryId == vote.categoryId)
    if vote.userId:
        query = query.filter(Vote.userId == vote.userId)
    else:
        query = query.filter(Vote.email == vote.email)
    
    existing_vote = query.first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted for this category")
    
    db_vote = Vote(**vote.model_dump())
    db.add(db_vote)
    try:
        db.commit()
        db.refresh(db_vote)
        return VoteResponse.model_validate(db_vote).model_dump()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="You have already voted for this category")

@app.get("/api/votes/{category_id}/count")
async def get_vote_count(category_id: str, db: Session = Depends(get_db)):
    count = db.query(func.count(Vote.id)).filter(Vote.categoryId == category_id).scalar()
    return {"count": count}

@app.delete("/api/votes/{category_id}")
async def delete_vote(category_id: str, userId: Optional[str] = None, email: Optional[str] = None, db: Session = Depends(get_db)):
    if not userId and not email:
        raise HTTPException(status_code=400, detail="User ID or Email is required")
    
    query = db.query(Vote).filter(Vote.categoryId == category_id)
    if userId:
        query = query.filter(Vote.userId == userId)
    else:
        query = query.filter(Vote.email == email)
    
    vote = query.first()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    db.delete(vote)
    db.commit()
    return {"message": "Vote removed"}

# Message routes
@app.get("/api/messages", response_model=list[MessageResponse])
async def get_messages(db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).order_by(ChatMessage.createdAt.asc()).limit(100).all()
    result = []
    for msg in messages:
        user = db.query(User).filter(User.id == msg.userId).first()
        msg_dict = MessageResponse.model_validate(msg).model_dump()
        msg_dict['user'] = {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
        result.append(msg_dict)
    return result

@app.post("/api/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(message: MessageCreate, db: Session = Depends(get_db)):
    db_message = ChatMessage(**message.model_dump())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    user = db.query(User).filter(User.id == db_message.userId).first()
    msg_dict = MessageResponse.model_validate(db_message).model_dump()
    msg_dict['user'] = {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }
    return msg_dict

# Question routes
@app.get("/api/questions", response_model=list[QuestionResponse])
async def get_questions(db: Session = Depends(get_db)):
    questions = db.query(Question).order_by(Question.createdAt.desc()).all()
    result = []
    for q in questions:
        user = db.query(User).filter(User.id == q.userId).first()
        q_dict = QuestionResponse.model_validate(q).model_dump()
        q_dict['user'] = {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
        result.append(q_dict)
    return result

@app.post("/api/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    db_question = Question(**question.model_dump())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    user = db.query(User).filter(User.id == db_question.userId).first()
    q_dict = QuestionResponse.model_validate(db_question).model_dump()
    q_dict['user'] = {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }
    return q_dict

# Contestant routes
@app.get("/api/categories/{category_id}/contestants", response_model=list[ContestantResponse])
async def get_contestants(category_id: str, db: Session = Depends(get_db)):
    contestants = db.query(Contestant).filter(Contestant.categoryId == category_id).order_by(Contestant.createdAt.asc()).all()
    return [ContestantResponse.model_validate(c).model_dump() for c in contestants]

@app.post("/api/categories/{category_id}/contestants", response_model=ContestantResponse, status_code=status.HTTP_201_CREATED)
async def create_contestant(category_id: str, contestant: ContestantCreate, db: Session = Depends(get_db)):
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_contestant = Contestant(categoryId=category_id, **contestant.model_dump())
    db.add(db_contestant)
    db.commit()
    db.refresh(db_contestant)
    return ContestantResponse.model_validate(db_contestant).model_dump()

@app.patch("/api/contestants/{contestant_id}", response_model=ContestantResponse)
async def update_contestant(contestant_id: str, contestant: ContestantUpdate, db: Session = Depends(get_db)):
    db_contestant = db.query(Contestant).filter(Contestant.id == contestant_id).first()
    if not db_contestant:
        raise HTTPException(status_code=404, detail="Contestant not found")
    
    update_data = contestant.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_contestant, key, value)
    
    db.commit()
    db.refresh(db_contestant)
    return ContestantResponse.model_validate(db_contestant).model_dump()

@app.delete("/api/contestants/{contestant_id}")
async def delete_contestant(contestant_id: str, db: Session = Depends(get_db)):
    db_contestant = db.query(Contestant).filter(Contestant.id == contestant_id).first()
    if not db_contestant:
        raise HTTPException(status_code=404, detail="Contestant not found")
    
    db.delete(db_contestant)
    db.commit()
    return {"message": "Contestant deleted successfully"}

@app.get("/")
async def root():
    return {"message": "Youth Connect API"}

