from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EstudianteBase(BaseModel):
    nombres: str
    apellidos: str
    curso: str
    paralelo: str
    padre_id: Optional[int] = None

class EstudianteCreate(EstudianteBase):
    pass

class Estudiante(EstudianteBase):
    id: int

    class Config:
        from_attributes = True

class PadreBase(BaseModel):
    carnet: str
    nombre_completo: str

class PadreCreate(PadreBase):
    pass

class Padre(PadreBase):
    id: int
    estudiantes: List[Estudiante] = []

    class Config:
        from_attributes = True

class DetalleReciboBase(BaseModel):
    estudiante_id: int

class DetalleReciboCreate(DetalleReciboBase):
    pass

class DetalleRecibo(DetalleReciboBase):
    id: int
    recibo_id: int
    estudiante: Estudiante

    class Config:
        from_attributes = True

class ReciboBase(BaseModel):
    padre_id: int
    monto: float = 50.0

class ReciboCreate(ReciboBase):
    estudiantes_ids: List[int]

class Recibo(ReciboBase):
    id: int
    nro_recibo: str
    fecha: datetime
    detalles: List[DetalleRecibo] = []
    padre: Padre

    class Config:
        from_attributes = True
