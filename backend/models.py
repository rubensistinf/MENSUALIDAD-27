from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Padre(Base):
    __tablename__ = "padres"

    id = Column(Integer, primary_key=True, index=True)
    carnet = Column(String, unique=True, index=True)
    nombre_completo = Column(String)

    estudiantes = relationship("Estudiante", back_populates="padre")
    recibos = relationship("Recibo", back_populates="padre")

class Estudiante(Base):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String)
    apellidos = Column(String)
    curso = Column(String)  # Ej: Kinder, Primero, Segundo
    paralelo = Column(String) # Ej: A, B, C
    padre_id = Column(Integer, ForeignKey("padres.id"), nullable=True)

    padre = relationship("Padre", back_populates="estudiantes")
    detalles_recibo = relationship("DetalleRecibo", back_populates="estudiante")

class Recibo(Base):
    __tablename__ = "recibos"

    id = Column(Integer, primary_key=True, index=True)
    nro_recibo = Column(String, unique=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto = Column(Float, default=50.0)
    padre_id = Column(Integer, ForeignKey("padres.id"))

    padre = relationship("Padre", back_populates="recibos")
    detalles = relationship("DetalleRecibo", back_populates="recibo")

class DetalleRecibo(Base):
    __tablename__ = "detalles_recibo"

    id = Column(Integer, primary_key=True, index=True)
    recibo_id = Column(Integer, ForeignKey("recibos.id"))
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"))

    recibo = relationship("Recibo", back_populates="detalles")
    estudiante = relationship("Estudiante", back_populates="detalles_recibo")
