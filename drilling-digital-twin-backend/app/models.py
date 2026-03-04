from pydantic import BaseModel
from typing import Optional, List

class SensorData(BaseModel):
    sensor_id: str
    value: float
    timestamp: Optional[str] = None

class MachineStatus(BaseModel):
    machine_id: str
    state: str
    alert: Optional[str] = None

class MaintenanceRecord(BaseModel):
    machine_id: str
    date: str
    action: str
    operator: str