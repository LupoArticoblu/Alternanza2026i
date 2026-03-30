import os, sys

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import json

import models, schemas, database
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv = __import__("dotenv", fromlist=["load_dotenv"]).load_dotenv
load_dotenv()

models.Base.metadata.create_all(bind=engine)

from sqlalchemy import text


def run_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE hotels ADD COLUMN images TEXT DEFAULT '[]'"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE hotels ADD COLUMN distanceFromCenter FLOAT"))
            conn.commit()
        except Exception:
            pass


run_migrations()

app = FastAPI(title="Hotel.io API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Hotel.io API is running"}


# ==================== USER ENDPOINTS ====================
@app.post("/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_data.email).first()
    if user is None or user.password != user_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    return {"message": "Login successful", "role": user.role}


@app.post("/register")
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_data.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = models.User(
        id=user_data.email, password=user_data.password, role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "role": new_user.role}


# ==================== HOTEL ENDPOINTS ====================
@app.get("/hotels", response_model=List[schemas.Hotel])
def get_hotels(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    hotels = db.query(models.Hotel).all()
    result = []
    for hotel in hotels:
        liked = False
        if user_id:
            liked = (
                db.query(models.Like)
                .filter(
                    models.Like.hotel_id == hotel.id, models.Like.user_id == user_id
                )
                .first()
                is not None
            )
        hotel_dict = {c.name: getattr(hotel, c.name) for c in hotel.__table__.columns}
        hotel_dict["reviews"] = hotel.reviews
        hotel_dict["isLiked"] = liked

        summary_val = hotel.ai_summary
        if summary_val is not None:
            try:
                hotel_dict["aiAnalysis"] = json.loads(summary_val)
            except Exception:
                hotel_dict["aiAnalysis"] = None
        else:
            hotel_dict["aiAnalysis"] = None

        result.append(schemas.Hotel.model_validate(hotel_dict))
    return result


@app.post("/hotels", response_model=schemas.Hotel)
def create_hotel(
    hotel: schemas.HotelCreate, owner_id: str, db: Session = Depends(get_db)
):
    hotel_id = models.Hotel.generate_id(hotel.name, hotel.location)
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if db_hotel:
        raise HTTPException(status_code=400, detail="This hotel already exists")
    new_hotel = models.Hotel(id=hotel_id, owner_id=owner_id, **hotel.dict())
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    return new_hotel


@app.put("/hotels/{hotel_id}", response_model=schemas.Hotel)
def update_hotel(
    hotel_id: str, hotel_update: schemas.HotelCreate, db: Session = Depends(get_db)
):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    update_data = hotel_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hotel, key, value)
    db.commit()
    db.refresh(db_hotel)
    return db_hotel


@app.delete("/hotels/{hotel_id}", response_model=schemas.Hotel)
def delete_hotel(hotel_id: str, db: Session = Depends(get_db)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db.delete(db_hotel)
    db.commit()
    return db_hotel


# ==================== REVIEW & LIKE ENDPOINTS ====================
@app.post("/hotels/{hotel_id}/reviews", response_model=schemas.Review)
def add_review(
    hotel_id: str,
    review: schemas.ReviewCreate,
    user_id: str,
    db: Session = Depends(get_db),
):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or user.role == "host":
        raise HTTPException(status_code=403, detail="Only guests can review hotels")

    new_review = models.Review(
        id=str(uuid.uuid4()),
        hotel_id=hotel_id,
        user=user_id,
        **review.dict(),
        date=datetime.now().strftime("%Y-%m-%d"),
    )
    db_hotel.ai_summary = None
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@app.post("/hotels/{hotel_id}/like")
def like_hotel(hotel_id: str, user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or user.role == "host":
        raise HTTPException(status_code=403, detail="Only guests can like hotels")

    existing_like = (
        db.query(models.Like)
        .filter(models.Like.hotel_id == hotel_id, models.Like.user_id == user_id)
        .first()
    )

    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")

    if existing_like:
        db.delete(existing_like)
        db_hotel.likes = db_hotel.likes - 1
    else:
        new_like = models.Like(hotel_id=hotel_id, user_id=user_id)
        db.add(new_like)
        db_hotel.likes = db_hotel.likes + 1

    db.commit()
    return {"total_likes": db_hotel.likes}


@app.post("/hotels/{hotel_id}/ai_summary")
def save_ai_summary(hotel_id: str, payload: dict, db: Session = Depends(get_db)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db_hotel.ai_summary = json.dumps(payload)
    db.commit()
    return {"status": "success"}


# ==================== CHATBOT ====================
_FAQ_FILE = os.path.join(os.path.dirname(__file__), "faqs.json")
_faqs = None


def load_faqs():
    global _faqs
    if _faqs is None:
        with open(_FAQ_FILE, "r", encoding="utf-8") as f:
            _faqs = json.load(f)
    return _faqs


def is_hotel_related(message: str) -> bool:
    """Controlla se il messaggio è correlato a Hotel.io (prenotazioni, servizi, etc.)"""
    hotel_keywords = [
        "hotel",
        "booking",
        "prenotazione",
        "camera",
        "room",
        "stay",
        "breakfast",
        "colazione",
        "cancellation",
        "cancellazione",
        "payment",
        "pagamento",
        "review",
        "recensione",
        "star",
        "stelle",
        "hotel.io",
        "hotelio",
        "price",
        "prezzo",
        "amenities",
        "servizi",
        "check-in",
        "check-out",
        "guest",
        "ospite",
        "host",
    ]
    msg_lower = message.lower()
    return any(keyword in msg_lower for keyword in hotel_keywords)


def find_similar_faq(message: str) -> dict | None:
    """Trova la FAQ più simile solo se il messaggio è correlato a Hotel.io"""
    if not is_hotel_related(message):
        return None

    faqs = load_faqs()
    message_lower = message.lower()
    words = set(message_lower.split())
    best_match = None
    best_score = 0

    for faq in faqs:
        question_words = set(faq["question"].lower().split())
        score = len(words & question_words)
        if score > best_score:
            best_score = score
            best_match = faq

    # Solo se c'è un match significativo (almeno 2 parole in comune)
    if best_score >= 2:
        return best_match
    return None


def get_hotel_context(db: Session) -> list:
    hotels_context = []
    try:
        all_hotels = (
            db.query(models.Hotel).order_by(models.Hotel.price.asc()).limit(3).all()
        )
        for h in all_hotels:
            dist = (
                f", {h.distanceFromCenter}km dal centro" if h.distanceFromCenter else ""
            )
            hotels_context.append(f"- {h.name} a {h.location}: €{h.price}/notte{dist}")
    except Exception as e:
        print(f"Error fetching hotels: {e}")
    return hotels_context


@app.post("/chatbot")
def chatbot_endpoint(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    user_message = request.message.strip()
    msg_lower = user_message.lower().strip()
    faqs = load_faqs()

    # 1. Risposte rapide per saluti
    greetings = ["hello", "hi", "ciao", "salve", "buongiorno", "buonasera"]
    if any(g in msg_lower for g in greetings):
        return {
            "answer": "Ciao! Sono l'assistente di Hotel.io. Come posso aiutarti a trovare l'hotel perfetto?",
            "source": "assistant",
            "context": [],
        }

    # 2. Hotel dal DB (per dare contesto a GPT)
    hotels_context = get_hotel_context(db)
    context_text = "\n".join(hotels_context) if hotels_context else ""

    # 3. FAQ solo per domande specifiche su Hotel.io
    similar_faq = find_similar_faq(user_message)
    if similar_faq:
        return {"answer": similar_faq["answer"], "source": "faq", "context": []}

    # 4. GPT 3.5 per tutto il resto
    if os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI

            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            system_prompt = """Sei un assistente di viaggio amichevole e conciso. 
Rispondi in 2-3 frasi in italiano.
Puoi consigliare hotel, destinazioni, attività turistiche e dare suggerimenti di viaggio.
Se l'utente chiede di hotel specifici, dai suggerimenti basandoti sui dati disponibili."""

            user_prompt = f"""Domanda: {user_message}"""
            if context_text:
                user_prompt += f"\n\nHotel disponibili:\n{context_text}"

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=150,
            )
            answer = response.choices[0].message.content or "Non ho capito, riprova!"
            return {"answer": answer, "source": "openai", "context": hotels_context}
        except Exception as e:
            print(f"OpenAI error: {e}")

    # 5. Fallback (senza OpenAI)
    fallback = "Sono l'assistente di Hotel.io! Prova a chiedermi di hotel, destinazioni o consigli di viaggio."
    return {"answer": fallback, "source": "fallback", "context": hotels_context}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
