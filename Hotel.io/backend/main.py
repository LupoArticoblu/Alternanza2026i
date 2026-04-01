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
    if user is None or str(user.password) != str(user_data.password):
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
                hotel_dict["aiAnalysis"] = json.loads(str(summary_val))
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
    if user is None or str(user.role) == "host":
        raise HTTPException(status_code=403, detail="Only guests can review hotels")

    new_review = models.Review(
        id=str(uuid.uuid4()),
        hotel_id=hotel_id,
        user=user_id,
        **review.dict(),
        date=datetime.now().strftime("%Y-%m-%d"),
    )
    db_hotel.ai_summary = ""  # type: ignore
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@app.post("/hotels/{hotel_id}/like")
def like_hotel(hotel_id: str, user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or str(user.role) == "host":
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
        # Ensure integer arithmetic for likes count
        db_hotel.likes = int(db_hotel.likes) - 1  # type: ignore[assignment]
    else:
        new_like = models.Like(hotel_id=hotel_id, user_id=user_id)
        db.add(new_like)
        # Ensure integer arithmetic for likes count
        db_hotel.likes = int(db_hotel.likes) + 1  # type: ignore[assignment]

    db.commit()
    return {"total_likes": db_hotel.likes}


@app.post("/hotels/{hotel_id}/ai_summary")
def save_ai_summary(hotel_id: str, payload: dict, db: Session = Depends(get_db)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db_hotel.ai_summary = json.dumps(payload)  # type: ignore[assignment]
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
    """Check if the message is related to Hotel.io (bookings, services, etc.)"""
    hotel_keywords = [
        "hotel",
        "booking",
        "book",
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
    """Find the most similar FAQ only if the message is Hotel.io related"""
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

    # Only if there is a significant match (at least 2 words in common)
    if best_score >= 2:
        return best_match
    return None


def get_relevant_faqs(message: str, top_k: int = 3) -> list:
    """Return the most relevant FAQ entries based on keyword overlap."""
    faqs = load_faqs()
    message_lower = message.lower()
    words = set(message_lower.split())
    scored = []
    for faq in faqs:
        question_words = set(faq["question"].lower().split())
        answer_words = set(faq["answer"].lower().split())
        combined = question_words | answer_words
        score = len(words & combined)
        scored.append((score, faq))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [faq for score, faq in scored[:top_k] if score > 0]


def get_hotel_context(db: Session) -> List[str]:
    """Return a list of strings with the cheapest 3 hotels."""
    try:
        hotels = (
            db.query(models.Hotel).order_by(models.Hotel.price.asc()).limit(3).all()
        )
    except Exception:
        return []
    context = []
    for h in hotels:
        dist = (
            f", {h.distanceFromCenter}km from center"
            if getattr(h, "distanceFromCenter", None) is not None
            else ""
        )
        context.append(f"- {h.name} in {h.location}: ${h.price}/night{dist}")
    return context


def find_hotels_in_message(db: Session, message: str) -> List[str]:
    """Search for hotels mentioned in the user's message using partial/fuzzy matching."""
    words = [w.strip() for w in message.split() if len(w.strip()) > 2]
    if not words:
        return []

    matched_hotels = []
    seen_ids = set()

    # Strategy 1: Search for multi-word combinations (e.g., "Aura Hotel")
    for i in range(len(words)):
        for j in range(i + 1, min(i + 4, len(words) + 1)):
            phrase = " ".join(words[i:j])
            try:
                results = (
                    db.query(models.Hotel)
                    .filter(models.Hotel.name.ilike(f"%{phrase}%"))
                    .limit(5)
                    .all()
                )
                for h in results:
                    if h.id not in seen_ids:
                        seen_ids.add(h.id)
                        dist = (
                            f", {h.distanceFromCenter}km from center"
                            if getattr(h, "distanceFromCenter", None) is not None
                            else ""
                        )
                        desc = getattr(h, "description", "")
                        desc_short = (
                            f". {desc[:100]}..."
                            if desc and len(desc) > 100
                            else f". {desc}"
                            if desc
                            else ""
                        )
                        images = getattr(h, "images", None)
                        img_info = ""
                        if images:
                            try:
                                img_list = (
                                    json.loads(images)
                                    if isinstance(images, str)
                                    else images
                                )
                                if img_list:
                                    img_info = f" Images available: {len(img_list)}"
                            except Exception:
                                pass
                        matched_hotels.append(
                            f"- {h.name} in {h.location}: ${h.price}/night{dist}{desc_short}{img_info}"
                        )
            except Exception:
                pass

    # Strategy 2: Single word search if no multi-word matches
    if not matched_hotels:
        for word in words:
            try:
                results = (
                    db.query(models.Hotel)
                    .filter(
                        (models.Hotel.name.ilike(f"%{word}%"))
                        | (models.Hotel.location.ilike(f"%{word}%"))
                    )
                    .limit(5)
                    .all()
                )
                for h in results:
                    if h.id not in seen_ids:
                        seen_ids.add(h.id)
                        dist = (
                            f", {h.distanceFromCenter}km from center"
                            if getattr(h, "distanceFromCenter", None) is not None
                            else ""
                        )
                        desc = getattr(h, "description", "")
                        desc_short = (
                            f". {desc[:100]}..."
                            if desc and len(desc) > 100
                            else f". {desc}"
                            if desc
                            else ""
                        )
                        matched_hotels.append(
                            f"- {h.name} in {h.location}: ${h.price}/night{dist}{desc_short}"
                        )
            except Exception:
                pass

    return matched_hotels


def get_all_hotels_summary(db: Session) -> List[str]:
    """Return a concise summary of ALL hotels in the database."""
    try:
        hotels = db.query(models.Hotel).all()
    except Exception:
        return []
    context = []
    for h in hotels:
        dist = (
            f", {h.distanceFromCenter}km from center"
            if getattr(h, "distanceFromCenter", None) is not None
            else ""
        )
        context.append(f"- {h.name} in {h.location}: ${h.price}/night{dist}")
    return context


@app.post("/chatbot")
def chatbot_endpoint(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    user_message = request.message.strip()
    msg_lower = user_message.lower()

    words_in_message = msg_lower.split()
    greetings = ["hello", "hi", "ciao", "hey", "greetings"]
    if len(words_in_message) <= 2 and any(g in msg_lower for g in greetings):
        return {
            "answer": "Hello! I'm your Hotel.io travel assistant. I can help you find hotels, plan trips, and answer questions about our platform. What would you like to know?",
            "source": "assistant",
            "context": [],
            "faq_suggestions": [],
        }

    # Priority 1: Search for specific hotels mentioned in the user's message
    specific_hotels = find_hotels_in_message(db, user_message)

    # Priority 2: If no specific hotel found, get all hotels summary for general context
    if specific_hotels:
        context_text = "\n".join(specific_hotels)
        hotels_context = specific_hotels
    else:
        all_hotels = get_all_hotels_summary(db)
        context_text = "\n".join(all_hotels) if all_hotels else ""
        hotels_context = all_hotels

    similar_faq = find_similar_faq(user_message)
    if similar_faq:
        all_faqs = load_faqs()
        other_faqs = [f for f in all_faqs if f["question"] != similar_faq["question"]]
        return {
            "answer": similar_faq["answer"],
            "source": "faq",
            "context": hotels_context,
            "faq_suggestions": other_faqs[:3],
        }

    system_prompt = (
        "You are a friendly, concise travel assistant for Hotel.io, a hotel booking platform. "
        "Answer the user's question clearly in 2-3 sentences. "
        "You can recommend hotels, destinations, tourist activities, and give travel tips. "
        "If the user asks about a specific hotel, check the hotel data provided below. "
        "If the hotel IS listed in the available hotels data, confirm it exists and provide its details. "
        "NEVER say a hotel is not listed if it appears in the available hotels data. "
        "Always be helpful and travel-focused."
    )

    try:
        import ollama
    except ImportError:
        raise Exception(
            "The 'ollama' package is not installed. Add it to requirements.txt and install it."
        )

    try:
        full_prompt = f"{system_prompt}\n\nUser question: {user_message}\n"
        if context_text:
            if specific_hotels:
                full_prompt += f"\nHotels matching your query:\n{context_text}\n"
            else:
                full_prompt += f"\nAll available hotels on Hotel.io:\n{context_text}\n"

        ollama_resp = ollama.generate(
            model="gemma3:4b",
            prompt=full_prompt,
            options={"temperature": 0.7, "num_predict": 150},
        )
        answer = (
            ollama_resp.get("response", "").strip()
            or "I'm sorry, I couldn't generate a response. Please try again."
        )

        relevant_faqs = get_relevant_faqs(user_message, top_k=3)

        return {
            "answer": answer,
            "source": "ollama",
            "context": hotels_context,
            "faq_suggestions": relevant_faqs,
        }
    except Exception as e:
        import traceback

        print(f"[ERROR] Ollama error: {e}")
        print(f"[ERROR] Full traceback:\n{traceback.format_exc()}")
        fallback = "I'm sorry, I'm having trouble connecting right now. I can help you with travel tips, hotel recommendations, and questions about Hotel.io. What would you like to know?"
        relevant_faqs = get_relevant_faqs(user_message, top_k=3)
        return {
            "answer": fallback,
            "source": "fallback",
            "context": hotels_context,
            "faq_suggestions": relevant_faqs,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
