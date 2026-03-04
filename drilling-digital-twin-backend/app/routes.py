from fastapi import APIRouter, HTTPException
from .stardog_service import StardogService
from neo4j import GraphDatabase

router = APIRouter()
service = StardogService()

# Neo4j config
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "your_secure_password_here"

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USER, NEO4J_PASSWORD)
)

@router.get("/machines")
def list_all_machines():
    """Returns all machines in the Knowledge Graph."""
    graph_urn = "urn:Drilling_machine_domain:Drilling_machine_domain"
    
    query = service.prefix + f"""
    SELECT DISTINCT ?m WHERE {{ 
        GRAPH <{graph_urn}> {{
            ?m a dm:Machine 
        }}
    }}"""
    
    results = service.run_query(query)
    bindings = results.get('results', {}).get('bindings', [])
    
    machine_ids = []
    for r in bindings:
        uri = r['m']['value']
        clean_id = uri.replace('#', ':').split(':')[-1]
        if clean_id:
            machine_ids.append(clean_id)
            
    print(f"✅ Cleaned IDs: {machine_ids}") 
    return machine_ids

@router.post("/machine/{machine_id}/update-sensors")
def update_sensors(machine_id: str, temp: float, vib: float, sound: float):
    # This query overwrites the reading with the specific values from the UI
    update_query = service.prefix + f"""
    DELETE {{ GRAPH <{service.graph_urn}> {{ ?s dm:hasReadingValue ?v }} }}
    WHERE {{ GRAPH <{service.graph_urn}> {{ ?s dm:hasReadingValue ?v }} }} ;
    
    INSERT DATA {{
        GRAPH <{service.graph_urn}> {{
            dm:TempSensor_01 dm:hasReadingValue {temp} .
            dm:VibSensor_01  dm:hasReadingValue {vib} .
            dm:SoundSensor_01 dm:hasReadingValue {sound} .
        }}
    }}"""
    service.run_update(update_query)
    return {"status": "Database Updated"}

@router.get("/machine/{machine_id}/devices")
def get_machine_status(machine_id: str):
    results = service.get_machine_insight(machine_id)
    bindings = results.get('results', {}).get('bindings', [])
    if not bindings:
        raise HTTPException(status_code=404, detail="Machine not found or no sensor data.")

    sensors = []
    for b in bindings:
        # Extract the Sensor Name (e.g., VibSensor_01)
        sensor_uri = b['sensor']['value']
        sensor_name = sensor_uri.split(':')[-1].split('#')[-1]

        sensors.append({
            "sensor_id": sensor_name,
            "type": b['sensorType']['value'].split(':')[-1].split('#')[-1],
            "reading": b['reading']['value'],
            "state": b.get('state', {}).get('value', 'normal'),
            "instruction": b.get('instruction', {}).get('value', 'No action needed')
        })

    return {
        "machine_id": machine_id,
        "sensors": sensors
    }

@router.get("/neo4j/machine/{machine_id}/sensors")
def get_machine_sensors(machine_id: str):
    
    query = """
    MATCH (m:Machine {id:$machine_id})-[:HAS_SENSOR]->(s:Sensor)
    RETURN s.id AS sensor_id,
           labels(s) AS labels,
           s.readingValue AS reading,
           s.lastUpdated AS lastUpdated
    """

    with driver.session() as session:
        result = session.run(query, machine_id=machine_id)
        records = list(result)

    if not records:
        raise HTTPException(status_code=404, detail="Machine not found or no sensors connected.")

    sensors = []
    for record in records:
        sensors.append({
            "sensor_id": record["sensor_id"],
            "type": record["labels"][0] if record["labels"] else "Sensor",
            "reading": record["reading"],
            "last_updated": str(record["lastUpdated"]) if record["lastUpdated"] else None
        })

    return {
        "machine_id": machine_id,
        "sensors": sensors
    }

@router.get("/machine/{machine_id}/health")
def get_health_report(machine_id: str):
    """Path for high-level reasoning: States and Alarms."""
    results = service.get_machine_health(machine_id)
    bindings = results.get('results', {}).get('bindings', [])
    
    if not bindings:
        return {"machine_id": machine_id, "status": "✅ OPERATIONAL", "alerts": []}

    found_states = []
    active_alerts = []
    
    for b in bindings:
        state_uri = b['state']['value']
        clean_state = state_uri.split(':')[-1].split('#')[-1]
        found_states.append(clean_state)
        
        if 'msg' in b:
            active_alerts.append(b['msg']['value'])

    return {
        "machine_id": machine_id,
        "status": f"🚨 {', '.join(set(found_states))}",
        "alerts": list(set(active_alerts))
    }

@router.get("/machine/{machine_id}/instructions")
def get_operator_instructions(machine_id: str):
    """Path for actionable intelligence: Recommended steps for operators."""
    results = service.get_machine_instructions(machine_id)
    bindings = results.get('results', {}).get('bindings', [])
    
    # If no instructions are inferred, the system is in a 'Safe' state
    if not bindings:
        return {
            "machine_id": machine_id, 
            "active_instructions": [],
            "summary": "No manual intervention required."
        }

    actions = []
    for b in bindings:
        actions.append({
            "sensor": b['sensor']['value'].split(':')[-1],
            "command": b['instr']['value']
        })

    return {
        "machine_id": machine_id,
        "active_instructions": actions,
        "summary": f"Detected {len(actions)} required action(s)."
    }

@router.get("/machine/{machine_id}/temperature-check")
def check_temperature_rule(machine_id: str):
    """Checks if the 'currentState_1' rule is firing for temperature sensors."""
    results = service.get_temperature_state(machine_id)
    bindings = results.get('results', {}).get('bindings', [])

    if not bindings:
        return {"error": "No temperature sensor found for this machine."}

    report = []
    for b in bindings:
        report.append({
            "sensor": b['sensor']['value'].split(':')[-1],
            "reading": b['reading']['value'],
            "rule_result": b.get('state', {}).get('value', "Rule NOT Triggered (Temp > 90)")
        })

    return {
        "machine_id": machine_id,
        "temperature_report": report
    }