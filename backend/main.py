from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, condecimal
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, DECIMAL, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from decimal import Decimal
import os
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette import status

from passlib.context import CryptContext

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- PASSWORD HASHING CONTEXT ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# --- END PASSWORD HASHING CONTEXT ---

# --- JWT CONFIGURATION ---
SECRET_KEY = "0809ac0c8a4e106f36090fa6d21013b147f747ebcb3c1f3505bb23e9f62f61f0" # MAKE SURE THIS IS CHANGED!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")
# --- END JWT CONFIGURATION ---

# Your existing Job model
class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    jobNumber = Column(String, nullable=False)
    clientName = Column(String, nullable=False)
    jobRef = Column(String, nullable=False)
    m2Area = Column(DECIMAL, nullable=False)
    hoursWorked = Column(DECIMAL, nullable=False)
    designFee = Column(DECIMAL, nullable=False)

# NEW USER MODEL
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

class JobCreate(BaseModel):
    jobNumber: str
    clientName: str
    jobRef: str
    m2Area: condecimal()
    hoursWorked: condecimal()
    designFee: condecimal()

    class Config:
        anystr_strip_whitespace = True

class UserCreate(BaseModel):
    email: str
    password: str

    class Config:
        anystr_strip_whitespace = True

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- HELPER FUNCTIONS FOR AUTHENTICATION ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# --- END HELPER FUNCTIONS ---

# --- NEW DEPENDENCY TO GET THE CURRENT USER ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception
    return user
# --- END NEW DEPENDENCY ---

# Your existing routes
@app.post("/api/jobs/", response_model=JobCreate)
async def create_job(job_in: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received job create request from user: {current_user.email}")
    db_job = Job(
        jobNumber=job_in.jobNumber,
        clientName=job_in.clientName,
        jobRef=job_in.jobRef,
        m2Area=job_in.m2Area,
        hoursWorked=job_in.hoursWorked,
        designFee=job_in.designFee,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
    
@app.get("/api/ping")
def ping():
    return {"message": "Backend is alive!"}

@app.get("/api/jobs/", response_model=List[JobCreate])
def read_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(Job).all()
    return [JobCreate(
        jobNumber=job.jobNumber,
        clientName=job.clientName,
        jobRef=job.jobRef,
        m2Area=Decimal(job.m2Area),
        hoursWorked=Decimal(job.hoursWorked),
        designFee=Decimal(job.designFee)
    ) for job in jobs]

# NEW ROUTES FOR AUTHENTICATION
@app.post("/api/register", response_model=UserCreate)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
