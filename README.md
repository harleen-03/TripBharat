# 🚗 TripBharat — AI Road Trip Planner for India

> India's first road-trip-native AI planner built for Indians,
> not tourists.

**Built by:** Harleen Kaur Bhatia — Backend Engineer → PM

---

## The Problem

Every travel app is built for tourists visiting the Taj Mahal.
Nobody has built for the 26-year-old in Bengaluru planning a
weekend drive to Coorg with friends.

Existing apps don't know:
- Which NH to take and where the ghat roads get dangerous
- Which dhaba near Maddur serves the best benne dosa
- That Coorg gets dangerously crowded on long weekends
- That petrol pumps on NH-275 are sparse after Kushalnagar

**TripBharat solves this.**

---

## What It Does

Enter your route → AI generates a complete, hyper-local plan:

| Section | What you get |
|---|---|
| 🚗 Route | NH number, distance, drive time, road warnings |
| ⛽ Fuel Stops | Pump brand, location, km mark |
| 🍽️ Eat on the Way | Local dhabas only — no chains, dish to order |
| 💎 Hidden Gems | Offbeat spots most tourists miss |
| 📅 Day-wise Plan | Full itinerary with timings |
| 💰 Budget | Realistic ₹ breakdown per person |
| ⚠️ Warnings | Weather, crowds, road conditions |
| 📲 WhatsApp Summary | Shareable trip card for your group |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 + Spring Boot 3.3 |
| AI | Groq API — Llama 3.3 70B |
| Auth | JWT + Spring Security + BCrypt |
| Database | PostgreSQL + JPA/Hibernate |
| Frontend | HTML + CSS + Vanilla JS |

---

## Features

- 🤖 AI-generated hyper-local trip plans in under 10 seconds
- 🔐 Email + password auth with JWT
- 💾 Save trips to your account — access from any device
- 📲 One-click WhatsApp share with your travel group
- 🗺️ 6 preset popular Indian routes
- 📱 Mobile responsive
- ⚡ Per-IP rate limiting

---

## How to Run Locally

### Prerequisites
- Java 21
- Maven
- PostgreSQL
- Groq API key (free at console.groq.com)

### Setup

```bash
# Clone
git clone https://github.com/harleen-03/TripBharat.git
cd TripBharat

# Create application.properties
# (see application.properties.example)
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# Fill in your credentials
# groq.api.key=YOUR_KEY
# spring.datasource.password=YOUR_DB_PASSWORD
# jwt.secret=YOUR_SECRET

# Run
./mvnw spring-boot:run

# Open
http://localhost:8080
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login → JWT |
| POST | `/api/plan` | None | Generate trip plan |
| POST | `/api/trips/save` | JWT | Save a trip |
| GET | `/api/trips` | JWT | Get saved trips |
| DELETE | `/api/trips/{id}` | JWT | Delete a trip |

---

## PM Case Study

Full case study including user research, problem statement,
feature prioritisation, and success metrics:

**[View on Notion](#)** *(coming soon)*

---

## Popular Routes Tested

| Route | Days | Style |
|---|---|---|
| Bengaluru → Coorg | 2 | Adventure |
| Delhi → Manali | 5 | Adventure |
| Mumbai → Goa | 3 | Relaxed |
| Chennai → Pondicherry | 1 | Relaxed |
| Pune → Mahabaleshwar | 2 | Family |
| Hyderabad → Hampi | 2 | Adventure |

---

## Roadmap

- [ ] Deploy on Railway
- [ ] Google OAuth login
- [ ] Google Maps route embed
- [ ] User feedback on generated plans
- [ ] More Indian routes + regional food data

---

## Disclaimer

⚠️ AI-generated plans based on training knowledge.
Always verify road conditions, fuel stops, and restaurant
availability before travel.

---

*Built as a PM portfolio project — 2025*  
*Harleen Kaur Bhatia ·
