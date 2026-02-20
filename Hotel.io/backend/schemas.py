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
    orm_mode = True

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
  class Config:
    orm_mode = True