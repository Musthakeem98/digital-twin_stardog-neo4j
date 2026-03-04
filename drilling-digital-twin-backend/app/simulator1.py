import time
import random
from .stardog_service1 import StardogService

def run_simulation():
    try:
        service = StardogService()
    except Exception as e:
        print(f"❌ Initialization Failed: {e}")
        return

    print("🚀 Digital Twin Simulator Active...")
    
    # 1. CORE DEFINITIONS
    PREFIX = """
    PREFIX dm: <urn:Drilling_machine_domain:> 
    PREFIX rdfs: <http://www.w3.org> 
    PREFIX xsd: <http://www.w3.org>
    """
    GRAPH_URN = "urn:Drilling_machine_domain:Drilling_machine_domain"
    
    # 2. INITIALIZATION (Run once)
    init_query = PREFIX + f"""
    INSERT DATA {{
        GRAPH <{GRAPH_URN}> {{
            dm:MainDrill_01 a dm:Machine ;
                            dm:hasSensor dm:TempSensor_01 ;
                            dm:hasSensor dm:VibSensor_01 ;
                            dm:hasSensor dm:SoundSensor_01.
            dm:TempSensor_01 a dm:TemperatureSensor .
            dm:VibSensor_01 a dm:VibrationSensor .
            dm:SoundSensor_01 a dm:SoundSensor .
            dm:Operator_Newbie a dm:Operator ;
                               dm:yearsExperience 0.1 ;
                               dm:operates dm:MainDrill_01 .
            dm:SafetyAlert_01 a dm:Alert .
            dm:MainDrill_01 dm:hasAlarm dm:SafetyAlert_01 .
        }}
    }}"""
    service.run_update(init_query)

    while True:
        temp = random.uniform(85, 105) 
        vib = random.uniform(40, 80)
        sound = random.uniform(70, 120)
        
        update_query = PREFIX + f"""
        DELETE {{ GRAPH <{GRAPH_URN}> {{ ?s dm:hasReadingValue ?v }} }}
        WHERE {{ GRAPH <{GRAPH_URN}> {{ ?s dm:hasReadingValue ?v }} }} ;
        
        INSERT DATA {{
            GRAPH <{GRAPH_URN}> {{
                dm:TempSensor_01 dm:hasReadingValue {temp:.2f} .
                dm:VibSensor_01  dm:hasReadingValue {vib:.2f} .
                dm:SoundSensor_01 dm:hasReadingValue {sound:.2f} .
            }}
        }}"""
        
        try:
            service.run_update(update_query)
            
            # 4. EXISTING REASONING QUERY
            reasoning_query = PREFIX + f"""
            SELECT DISTINCT ?state ?msg
            WHERE {{
                GRAPH <{GRAPH_URN}> {{
                    dm:MainDrill_01 dm:currentState_1 ?state .
                    OPTIONAL {{
                        dm:MainDrill_01 dm:hasAlarm ?alarm .
                        ?alarm dm:alertMessage ?msg .
                    }}
                }}
            }}"""
            print(f"Debug | Reasoning Query: {reasoning_query}")  # Debugging line to check the generated query
            
            result = service.run_query(reasoning_query, reasoning=True)
            bindings = result.get('results', {}).get('bindings', [])
            
            status = "✅ STATUS: OPERATIONAL"
            if bindings:
                found_states = []
                active_alerts = []
                for b in bindings:
                    state_val = b['state']['value']
                    clean_state = state_val.split(':')[-1].split('#')[-1] if ':' in state_val else state_val
                    found_states.append(clean_state)
                    if 'msg' in b:
                        active_alerts.append(b['msg']['value'])
                
                status = f"🚨 STATUS: {', '.join(found_states)}"
                if active_alerts:
                    status += f" | MESSAGE: {' / '.join(set(active_alerts))}"

            # ---------------------------------------------------------
            # 5. NEW: INSTRUCTION CHECK (Verifying your Designer logic)
            # ---------------------------------------------------------
            instr_query = PREFIX + f"""
            SELECT ?instr WHERE {{
                GRAPH <{GRAPH_URN}> {{
                    dm:VibSensor_01 dm:recommendedInstruction ?instr .
                }}
            }}"""
            instr_result = service.run_query(instr_query, reasoning=True)
            instr_bindings = instr_result.get('results', {}).get('bindings', [])
            print(f"Debug | Instruction Bindings: {instr_bindings}")  # Debugging line to check instruction query results
            
            action_text = ""
            if instr_bindings:
                action_val = instr_bindings[0]['instr']['value']
                action_text = f" | 🛠️ ACTION: {action_val}"
            # ---------------------------------------------------------

            print(f"Update Sent | Temp: {temp:.2f}°C | Vib: {vib:.2f}Hz | {status}{action_text}")

        except Exception as e:
            print(f"❌ Error: {e}")
        
        time.sleep(5)

if __name__ == "__main__":
    run_simulation()