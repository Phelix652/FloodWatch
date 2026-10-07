from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from pathlib import Path

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_DIR = BASE_DIR / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE = str(DATABASE_DIR / "floodwatch.db")


def get_connection():
    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


def create_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            location TEXT NOT NULL,

            latitude REAL NOT NULL,

            longitude REAL NOT NULL,

            severity TEXT NOT NULL,

            water_level REAL NOT NULL,

            description TEXT

        )
    """)

    connection.commit()

    connection.close()


# Create database when backend starts
create_database()


# =========================
# DATA MODEL
# =========================

class FloodReport(BaseModel):

    location: str

    latitude: float

    longitude: float

    severity: str

    water_level: float

    description: str


# =========================
# ROUTES
# =========================

@app.get("/")
def home():

    return {
        "message": "FloodWatch backend is running!"
    }


@app.get("/reports")
def get_reports():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM reports
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    reports = []

    for row in rows:

        reports.append(dict(row))

    return {
        "reports": reports
    }

@app.get("/stats")
def get_stats():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT COUNT(*) FROM reports
    """)
    total = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM reports
        WHERE severity = 'High'
    """)
    high = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM reports
        WHERE severity = 'Medium'
    """)
    medium = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM reports
        WHERE severity = 'Low'
    """)
    low = cursor.fetchone()[0]

    connection.close()

    return {
        "total": total,
        "high": high,
        "medium": medium,
        "low": low
    }

@app.post("/reports")
def create_report(report: FloodReport):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO reports
        (
            location,
            latitude,
            longitude,
            severity,
            water_level,
            description
        )

        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        report.location,
        report.latitude,
        report.longitude,
        report.severity,
        report.water_level,
        report.description
    ))

    connection.commit()

    new_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Flood report saved!",
        "id": new_id
    }