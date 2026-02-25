#qui inseriamo le classi per la serializzazione
from pydantic import BaseModel, EmailStr
from typing import Optional 

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

class Hotel(HotelBase):
  id:str
  owner_id:str
  likes: int
  class Config:
    from_attributes = True

class ReviewBase(BaseModel): #prendiamo l'id utente dal login
  comment: str
  rating: float

class ReviewCreate(ReviewBase):
  pass # eredita i campi di ReviewBase

class Review(ReviewBase):
  id: str
  hotel_id: str
  user_id: str
  class Config:
    from_attributes = True 