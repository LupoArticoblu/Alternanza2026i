# Schemi Pydantic usati per la validazione e serializzazione dei dati
# scambiati via API: utenti, hotel, recensioni e messaggi per il chatbot.
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
  email: EmailStr
  role: str

class UserCreate(UserBase):
  password: str

class User(UserBase):
  id: str
  class Config:
    from_attributes = True #si possono usare i campi come se fossero attributi

class HotelBase(BaseModel):
  name:str
  location:str
  description:str
  price:float
  distanceFromCenter: Optional[float] = None
  imageUrl: Optional[str] = None
  images: Optional[List[str]] = []

class HotelCreate(HotelBase):
  pass


# ---------------------------------------------------------------------------
# Chat models – used by the simple /chat endpoint that the Angular frontend
# calls. They are deliberately minimal: the request contains the user message
# and optional generation parameters; the response returns the answer and a
# source identifier ("local-llm" or "faq").
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    temperature: Optional[float] = None
    max_new_tokens: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    source: str
class ReviewCreate(BaseModel): #prendiamo l'id utente dal login
   comment: str
   rating: float

class Review(ReviewCreate):
  id:str
  hotel_id: str
  user: str
  date: str
  class Config:
    from_attributes = True

class Hotel(HotelBase):
  id:str
  owner_id:str
  likes: int
  isLiked: bool = False
  reviews: list[Review] = [] #inizializziamo la lista di recensioni

  # aiAnalysis è il riassunto AI decodificato da JSON (può essere dict, list o None)
  aiAnalysis: Optional[object] = None

  model_config = {"from_attributes": True, "extra": "ignore"}


