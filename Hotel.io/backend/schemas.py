#qui inseriamo le classi per la serializzazione
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
  imageUrl: Optional[str] = None
  images: Optional[List[str]] = []

class HotelCreate(HotelBase):
  pass

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
  
  # Questo campo riceve il JSON del riassunto AI sotto forma di stringa dal database
  ai_summary: Optional[str] = None
  
  class Config:
    from_attributes = True

