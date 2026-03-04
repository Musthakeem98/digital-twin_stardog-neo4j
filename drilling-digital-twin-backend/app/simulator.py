# simulator.py
import time
import random
from neo4j import GraphDatabase
from app.stardog_service import StardogService

# -----------------------------
# Configuration
# -----------------------------
MACHINE_ID = "MainDrill_01"

STARDOG_GRAPH = "urn:Drilling_machine_domain:Drilling_machine_domain"

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "your_secure_password_here"

# -----------------------------
# Initialize Services
# -----------------------------
stardog_service = StardogService()
neo4j_driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USER, NEO4J_PASSWORD)
)

# -----------------------------
# Neo4j Update Function
# -----------------------------
def update_neo4j(temp, vib, sound):
    with neo4j_driver.session() as session:
        session.run("""
            MATCH (t:Sensor {id:"TempSensor_01"})
            MATCH (v:Sensor {id:"VibSensor_01"})
            MATCH (s:Sensor {id:"SoundSensor_01"})
            SET t.readingValue = $temp,
                v.readingValue = $vib,
                s.readingValue = $sound,
                t.lastUpdated = datetime(),
                v.lastUpdated = datetime(),
                s.lastUpdated = datetime()
        """, temp=temp, vib=vib, sound=sound)


# -----------------------------
# Main Simulator Loop
# -----------------------------
while True:

    # 1️⃣ Check Manual Mode in Stardog
    check_manual_query = f"""
    PREFIX dm: <urn:Drilling_machine_domain:>
    ASK {{
        GRAPH <{STARDOG_GRAPH}> {{
            dm:{MACHINE_ID} dm:manualMode true
        }}
    }}
    """

    result = stardog_service.run_query(check_manual_query)
    is_manual = result.get("boolean", False)

    if is_manual:
        print(f"⏸️ Simulator Paused: {MACHINE_ID} is in Manual Mode.")
    
    else:
        # 2️⃣ Generate Sensor Values
        temp = random.uniform(85, 95)
        vib = random.uniform(40, 60)
        sound = random.uniform(10, 30)

        # 3️⃣ Update Stardog
        update_stardog_query = f"""
        PREFIX dm: <urn:Drilling_machine_domain:>

        DELETE {{
            GRAPH <{STARDOG_GRAPH}> {{
                ?s dm:hasReadingValue ?v
            }}
        }}
        WHERE {{
            GRAPH <{STARDOG_GRAPH}> {{
                ?s dm:hasReadingValue ?v
            }}
        }};

        INSERT DATA {{
            GRAPH <{STARDOG_GRAPH}> {{
                dm:TempSensor_01 dm:hasReadingValue {temp:.2f} .
                dm:VibSensor_01 dm:hasReadingValue {vib:.2f} .
                dm:SoundSensor_01 dm:hasReadingValue {sound:.2f} .
            }}
        }}
        """

        stardog_service.run_update(update_stardog_query)

        # 4️⃣ Update Neo4j
        update_neo4j(temp, vib, sound)

        print(f"🔄 Simulating → Temp: {temp:.2f}, Vib: {vib:.2f}, Sound: {sound:.2f}")

    time.sleep(5)