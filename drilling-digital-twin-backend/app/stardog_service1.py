import stardog
import os
from dotenv import load_dotenv
from pathlib import Path

base_dir = Path(__file__).resolve().parent.parent
env_path = base_dir / '.env'
load_dotenv(dotenv_path=env_path)

class StardogService:
    def __init__(self):
        url = os.getenv("STARDOG_URL")
        user = os.getenv("STARDOG_USER")
        pw = os.getenv("STARDOG_PASS")
        db = os.getenv("STARDOG_DB")

        if not all([url, user, pw, db]):
            raise ValueError("Missing Stardog credentials in .env file!")

        self.conn_details = {
            'endpoint': url,
            'username': user,
            'password': pw
        }
        self.db_name = db
        self._verify_connectivity()

    def _verify_connectivity(self):
        """Verifies connection by running a minimal query."""
        try:
            with self.get_connection() as conn:
                # Basic ping query to ensure DB exists and credentials work
                conn.select("SELECT * WHERE { ?s ?p ?o } LIMIT 1")
                print(f"✅ Connected to Stardog Cloud | DB: {self.db_name}")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            raise

    def get_connection(self):
        return stardog.Connection(self.db_name, **self.conn_details)

    def run_query(self, sparql_query, reasoning=True):
        # Use the same URN where your rules and data live
        GRAPH_URN = "urn:Drilling_machine_domain:Drilling_machine_domain"
        
        with self.get_connection() as conn:
            # We add 'schema' to tell Stardog where to find the rules
            # If your rules are in the default graph, remove the 'schema' param
            return conn.select(
                sparql_query, 
                reasoning=reasoning,
                schema="Drilling_machine_domain"
            )


    def run_update(self, update_query):
        with self.get_connection() as conn:
            conn.update(update_query)
