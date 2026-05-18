from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
import os
import uuid

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Mensualidad - UE 27 de Mayo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESTUDIANTES ---

@app.get("/api/estudiantes", response_model=List[schemas.Estudiante])
def get_estudiantes(
    skip: int = 0, 
    limit: int = 100, 
    curso: str = None, 
    paralelo: str = None, 
    search: str = None, 
    db: Session = Depends(get_db)
):
    query = db.query(models.Estudiante)
    
    if curso:
        query = query.filter(models.Estudiante.curso == curso)
    if paralelo:
        query = query.filter(models.Estudiante.paralelo == paralelo)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Estudiante.nombres.ilike(search_filter),
                models.Estudiante.apellidos.ilike(search_filter)
            )
        )
        
    return query.offset(skip).limit(limit).all()

@app.post("/api/estudiantes", response_model=schemas.Estudiante)
def create_estudiante(estudiante: schemas.EstudianteCreate, db: Session = Depends(get_db)):
    db_estudiante = models.Estudiante(**estudiante.model_dump())
    db.add(db_estudiante)
    db.commit()
    db.refresh(db_estudiante)
    return db_estudiante

@app.get("/api/estudiantes/exportar")
def exportar_estudiantes(curso: str = None, paralelo: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Estudiante)
    if curso:
        query = query.filter(models.Estudiante.curso == curso)
    if paralelo:
        query = query.filter(models.Estudiante.paralelo == paralelo)
    
    estudiantes = query.all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inscritos"
    
    # Headers
    headers = ["ID", "Nombres", "Apellidos", "Curso", "Paralelo"]
    ws.append(headers)
    
    # Styling headers
    header_fill = PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid") # Naranja institucional
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.alignment = Alignment(horizontal="center")
        cell.fill = header_fill
        
    # Data
    for est in estudiantes:
        ws.append([est.id, est.nombres, est.apellidos, est.curso, est.paralelo])
        
    # Adjust widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width

    file_path = "estudiantes_export.xlsx"
    wb.save(file_path)
    
    return FileResponse(path=file_path, filename="Lista_Inscritos_27_de_Mayo.xlsx", media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

# --- PADRES Y RECIBOS ---

@app.get("/api/padres/{carnet}", response_model=schemas.Padre)
def get_padre_by_carnet(carnet: str, db: Session = Depends(get_db)):
    padre = db.query(models.Padre).filter(models.Padre.carnet == carnet).first()
    if not padre:
        raise HTTPException(status_code=404, detail="Padre no encontrado")
    return padre

@app.post("/api/recibos", response_model=schemas.Recibo)
def create_recibo(recibo_data: schemas.ReciboCreate, db: Session = Depends(get_db)):
    # Generar Nro Recibo
    import random
    nro_recibo = f"REC-{random.randint(10000, 99999)}"
    
    db_recibo = models.Recibo(
        nro_recibo=nro_recibo,
        monto=recibo_data.monto,
        padre_id=recibo_data.padre_id
    )
    db.add(db_recibo)
    db.commit()
    db.refresh(db_recibo)
    
    for est_id in recibo_data.estudiantes_ids:
        # Update student's padre_id if not set (or always link them)
        estudiante = db.query(models.Estudiante).filter(models.Estudiante.id == est_id).first()
        if estudiante:
            estudiante.padre_id = recibo_data.padre_id
            
        detalle = models.DetalleRecibo(recibo_id=db_recibo.id, estudiante_id=est_id)
        db.add(detalle)
        
    db.commit()
    db.refresh(db_recibo)
    return db_recibo

@app.post("/api/padres", response_model=schemas.Padre)
def create_padre(padre: schemas.PadreCreate, db: Session = Depends(get_db)):
    db_padre = models.Padre(**padre.model_dump())
    db.add(db_padre)
    db.commit()
    db.refresh(db_padre)
    return db_padre

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
