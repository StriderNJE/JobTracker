from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, condecimal
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, DECIMAL, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from decimal import Decimal
import os
import logging

# --- NEW IMPORTS FOR USER AUTHENTICATION ---
from passlib.context import CryptContext
from pydantic import BaseModel as PydanticBaseModel # Use an alias to avoid conflict
# --- END NEW IMPORTS ---

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

# --- NEW USER MODEL ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
# --- END NEW USER MODEL ---

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

# --- NEW USER Pydantic SCHEMA ---
class UserCreate(PydanticBaseModel):
    email: str
    password: str

    class Config:
        anystr_strip_whitespace = True
# --- END NEW USER Pydantic SCHEMA ---

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

# Your existing routes
@app.post("/api/jobs/", response_model=JobCreate)
async def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    logger.info(f"Received job create request data: {job_in.model_dump_json()}")
    
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
def read_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return [JobCreate(
        jobNumber=job.jobNumber,
        clientName=job.clientName,
        jobRef=job.jobRef,
        m2Area=Decimal(job.m2Area),
        hoursWorked=Decimal(job.hoursWorked),
        designFee=Decimal(job.designFee)
    ) for job in jobs]
