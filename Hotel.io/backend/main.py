from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
#import moduli per gestire id recensioni e date
from datetime import datetime
import uuid

import models, schemas, database
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
#crea le tabelle nel db
models.Base.metadata.create_all(bind=engine)

# Migrazione al volo: aggiungi colonna images se non esiste
from sqlalchemy import text
def run_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE hotels ADD COLUMN images TEXT DEFAULT '[]'"))
            conn.commit()
        except Exception:
            pass  # colonna già esistente

run_migrations()

app = FastAPI(title="Hotel.io API")

# Configurazione CORS per permettere chiamate da Angular (solitamente porta 4200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://hotel.io:3000",
        "http://www.hotel.io:3000",
        "http://hotel.local:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Hotel.io API is running"}

#END POINT UTENTI
@app.post("/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
  #controllo mail e password
  user = db.query(models.User).filter(models.User.id == user_data.email).first()
  #in caso di mancanza o errore password
  if not user or user.password != user_data.password:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
  
  return {"message": "Login successful", "role": user.role} 

#REGISTRA UTENTI
@app.post("/register")
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
  #controllo se l'utente esiste
  user = db.query(models.User).filter(models.User.id == user_data.email).first()
  if user:
    raise HTTPException(status_code=400, detail="User already exists")
  
  #creazione nuovo utente
  new_user = models.User(
    id=user_data.email,
    password=user_data.password,
    role=user_data.role
  )
  db.add(new_user)
  db.commit()
  db.refresh(new_user)
  return {"message": "User registered successfully", "role": new_user.role}

#END POINT HOTEL
@app.get("/hotels", response_model=List[schemas.Hotel])
def get_hotels(user_id: str = None, db: Session = Depends(get_db)):
  hotels = db.query(models.Hotel).all()
  result = []
  for hotel in hotels:
    liked = False
    if user_id:
      liked = db.query(models.Like).filter(
        models.Like.hotel_id == hotel.id,
        models.Like.user_id == user_id
      ).first() is not None
    hotel_dict = {c.name: getattr(hotel, c.name) for c in hotel.__table__.columns}
    hotel_dict['reviews'] = hotel.reviews
    hotel_dict['isLiked'] = liked
    
    # Decodifichiamo l'ai_summary in modo che FastApi lo converta nell'oggetto corretto
    if hotel.ai_summary:
      try:
        hotel_dict['aiAnalysis'] = json.loads(hotel.ai_summary)
      except:
        hotel_dict['aiAnalysis'] = None
    else:
      hotel_dict['aiAnalysis'] = None

    result.append(schemas.Hotel.model_validate(hotel_dict))
  return result

@app.post("/hotels", response_model=schemas.Hotel)
def create_hotel(hotel:schemas.HotelCreate, owner_id:str, db:Session = Depends(get_db)):
  #generiamo l'id composto
  hotel_id = models.Hotel.generate_id(hotel.name, hotel.location)

  #controlliamo l'esistenza
  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  if db_hotel:
    raise HTTPException(status_code=400, detail= "This hotel already exist")

  #dati per l'hotel se inseribile
  new_hotel = models.Hotel(
    id=hotel_id,
    owner_id=owner_id,
    **hotel.dict()
  )
  db.add(new_hotel)
  db.commit()
  db.refresh(new_hotel)
  return new_hotel

@app.put("/hotels/{hotel_id}", response_model=schemas.Hotel) #aggiorna hotel
def update_hotel(hotel_id:str, hotel_update:schemas.HotelCreate, db:Session = Depends(get_db)):
  #trova hotel
  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  if not db_hotel:
    raise HTTPException(status_code=404, detail="Hotel not found")
  
  #aggiorna i campi
  update_data = hotel_update.dict(exclude_unset=True)
  for key, value in update_data.items():
    setattr(db_hotel, key, value)
  
  db.commit()
  db.refresh(db_hotel)
  return db_hotel

#elimina hotel
@app.delete("/hotels/{hotel_id}", response_model=schemas.Hotel)
def delete_hotel(hotel_id:str, db:Session = Depends(get_db)):
  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  if not db_hotel:
    raise HTTPException(status_code=404, detail="Hotel not found")
  db.delete(db_hotel)
  db.commit()
  return db_hotel

#ENDPOINT RECENSIONI e LIKES
@app.post("/hotels/{hotel_id}/reviews", response_model=schemas.Review)
def add_review(hotel_id:str, review:schemas.ReviewCreate, user_id:str, db:Session = Depends(get_db)):
  #verifica esistenza hotel
  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  if not db_hotel:
    raise HTTPException(status_code=404, detail="Hotel not found")

  #limitiamo le recensioni agli utenti guest
  user = db.query(models.User).filter(models.User.id == user_id).first()
  if not user or user.role == "host":
    raise HTTPException(status_code=403, detail="Only guests can review hotels")

  #creazione recensione
  new_review = models.Review(
    id=str(uuid.uuid4()), # uuid è il modulo per generare id casuali
    hotel_id=hotel_id,
    user=user_id,
    # comment=review.comment,
    # rating=review.rating, vengono sostituiti da **review.dict()
    **review.dict(), #spacchettamento del review come dizionario
    date=datetime.now().strftime("%Y-%m-%d")
  )

  # SETTA IL SUMMARY AI A NULLO:
  # Quando viene aggiunta una nuova recensione, le informazioni cambiano. 
  # Invalidiamo (resettiamo) il summary esistente, cosí il prossimo utente 
  # che visiterà la pagina dovrà generarne uno nuovo aggiornato.
  db_hotel.ai_summary = None 
  db.add(new_review)
  db.commit()
  db.refresh(new_review)
  return new_review

#likes
@app.post("/hotels/{hotel_id}/like")
def like_hotel(hotel_id:str, user_id:str, db:Session = Depends(get_db)):
  #limitiamo i like agli utenti
  user = db.query(models.User).filter(models.User.id == user_id).first()
  if not user or user.role == "host":
    raise HTTPException(status_code=403, detail="Only guests can like hotels")

  #se il like è già stato inserito dall' utente non deve essere inserito di nuovo
  existing_like = db.query(models.Like).filter(models.Like.hotel_id == hotel_id, models.Like.user_id == user_id).first()

  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  #logica toggle per i like
  if existing_like:
    db.delete(existing_like)
    db_hotel.likes -= 1
  else:
    new_like = models.Like( hotel_id = hotel_id, user_id = user_id)
    db.add(new_like)
    db_hotel.likes += 1



  db.commit()
  return {"total_likes": db_hotel.likes}

# Endpoint per ricevere e salvare nel DB il sommario AI generato dal frontend.
# In questo modo il calcolo pesante di Ollama viene fatto una volta sola,
# e tutti gli utenti successivi leggeranno subito il risultato.
@app.post("/hotels/{hotel_id}/ai_summary")
def save_ai_summary(hotel_id: str, payload: dict, db: Session = Depends(get_db)):
  db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
  if not db_hotel:
    raise HTTPException(status_code=404, detail="Hotel not found")
  
  # Salviamo il JSON stringificato nel campo testuale del database.
  db_hotel.ai_summary = json.dumps(payload)
  db.commit()
  
  return {"status": "success"}
