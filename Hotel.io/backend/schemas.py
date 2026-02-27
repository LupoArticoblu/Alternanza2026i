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
  reviews: list[Review] = [] #inizializziamo la lista di recensioni
  class Config:
    from_attributes = True

