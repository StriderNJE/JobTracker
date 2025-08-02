from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, condecimal
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL environment variable not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    jobNumber = Column(String, nullable=False)
    clientName = Column(String, nullable=False)
    jobRef = Column(String, nullable=False)
    m2Area = Column(Float, nullable=False)
    hoursWorked = Column(Float, nullable=False)
    designFee = Column(Float, nullable=False)

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

app = FastAPI()

# Update CORS middleware to allow only your frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- Replace with your actual frontend URL
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

@app.post("/api/jobs/", response_model=JobCreate)
async def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    logger.info(f"Received job create request data: {job_in.model_dump_json()}")
    
    db_job = Job(
        jobNumber=job_in.jobNumber,
        clientName=job_in.clientName,
        jobRef=job_in.jobRef,
        m2Area=float(job_in.m2Area),
        hoursWorked=float(job_in.hoursWorked),
        designFee=float(job_in.designFee),
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
    
@app.get("/api/ping")
def ping():
    return {"message": "Backend is alive!"}

from fastapi import Response

@app.get("/api/jobs/", response_model=List[JobCreate])
def read_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    # Convert SQLAlchemy models to Pydantic schema
    return [JobCreate(
        jobNumber=job.jobNumber,
        clientName=job.clientName,
        jobRef=job.jobRef,
        m2Area=job.m2Area,
        hoursWorked=job.hoursWorked,
        designFee=job.designFee
    ) for job in jobs]

