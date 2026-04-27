# Questo file configura la connessione al database SQLite,
# definisce l'engine SQLAlchemy, la session factory e la Base ORM.
# Contiene inoltre il generatore di sessioni usato dai dependency
# del backend FastAPI.
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./hotel_io.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread":False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base=declarative_base()

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()