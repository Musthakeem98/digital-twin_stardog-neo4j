import stardog
import os
from dotenv import load_dotenv

load_dotenv()

class StardogService:
    def __init__(self):
        self.conn_details = {
            'endpoint': os.getenv("STARDOG_URL"),
            'username': os.getenv("STARDOG_USER"),
            'password': os.getenv("STARDOG_PASS")
        }
        self.db_name = os.getenv("STARDOG_DB")
        # Standardized prefixes to match simulator precisely
        self.prefix = """
        PREFIX dm: <urn:Drilling_machine_domain:> 
        PREFIX rdfs: <http://www.w3.org> 
        PREFIX xsd: <http://www.w3.org>
        """
        self.graph_urn = "urn:Drilling_machine_domain:Drilling_machine_domain"

    def get_connection(self):
        return stardog.Connection(self.db_name, **self.conn_details)

    def run_query(self, sparql_query, reasoning=True):
        with self.get_connection() as conn:
            return conn.select(
                sparql_query, 
                reasoning=reasoning,
                schema="Drilling_machine_domain"
            )

    def run_update(self, query):
        with self.get_connection() as conn:
            return conn.update(query)

    def get_machine_insight(self, machine_id: str):
        # FIX: Using the bracketed URI format <urn:...> ensures machine_id isn't misinterpreted
        query = self.prefix + f"""
        SELECT ?sensor ?state ?instruction ?reading ?sensorType
        WHERE {{
            GRAPH <{self.graph_urn}> {{
                dm:{machine_id} dm:hasSensor ?sensor .
                ?sensor a ?sensorType ;
                        dm:hasReadingValue ?reading .
                OPTIONAL {{ ?sensor dm:currentState ?state . }}
                OPTIONAL {{ ?sensor dm:recommendedInstruction ?instruction . }}
            }}
        }}"""
        return self.run_query(query, reasoning=True)
    
    def get_machine_health(self, machine_id: str):
        # Use the prefix variable 'dm:' instead of full <urn:...>
        query = self.prefix + f"""
            SELECT DISTINCT ?state ?msg
            WHERE {{
                GRAPH <{self.graph_urn}> {{
                    dm:{machine_id} dm:currentState_1 ?state .
                    OPTIONAL {{
                        dm:{machine_id} dm:hasAlarm ?alarm .
                        ?alarm dm:alertMessage ?msg .
                    }}
                }}
            }}"""
        return self.run_query(query, reasoning=True)
    
    def get_machine_instructions(self, machine_id: str):
        # FIX: Wrapped machine_id in full URN brackets to prevent prefix errors
        query = self.prefix + f"""
        SELECT DISTINCT ?sensor ?instr
        WHERE {{
            GRAPH <{self.graph_urn}> {{
                dm:{machine_id} dm:hasSensor ?sensor .
                ?sensor dm:recommendedInstruction ?instr .
            }}
        }}"""
        return self.run_query(query, reasoning=True)
    
    def get_temperature_state(self, machine_id: str):
        # Note: We use the exact property name from your rule: currentState_1
        query = self.prefix + f"""
        SELECT ?sensor ?reading ?state
        WHERE {{
            GRAPH <{self.graph_urn}> {{
                dm:{machine_id} dm:hasSensor ?sensor .
                ?sensor a dm:TemperatureSensor ;
                        dm:hasReadingValue ?reading .
                OPTIONAL {{ ?sensor dm:currentState_1 ?state . }}
            }}
        }}"""
        return self.run_query(query, reasoning=True)