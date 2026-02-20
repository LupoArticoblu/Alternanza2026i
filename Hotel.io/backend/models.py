from sqlalchemy import Column, String, Float, ForeignKey
from database import Base

#importa il modulo re per le espressioni regolari
import re

#normalizzazione degli id
def normalize_id(text: str) -> str:
  next = next.lower()
  text = re.sub(r'[^a-z0-9]+', '-', text)
  return text.strip('-')

#modello utente
class User(Base):
  __tablename__ = 'users'
  id = Column(String, primary_key=True, index=True) #id = email
  password = Column(String)
  role = Column(String) #utente o albergatore

class Hotel(Base):
  __tablename__='hotels'
  id = Column(String, primary_key=True, index=True) #id = nome + posizione
  name = Column(String)
  location = Column(String)
  description = Column(String)
  price = Column(Float)
  imageUrl = Column(String)
  owner_id = Column(String, ForeignKey('users.id'))

  @staticmethod
  def generate_id(name: str, location: str) -> str:
    return f"{normalize_id(name)}-{normalize_id(location)}"

