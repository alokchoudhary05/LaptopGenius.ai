"""
LaptopGenius - Enterprise Laptop Price Predictor API
A modern FastAPI backend for laptop price prediction
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import pandas as pd
import os

# Initialize FastAPI app
app = FastAPI(
    title="LaptopGenius API",
    description="Enterprise-grade Laptop Price Prediction API",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model and dataframe
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'artifacts')
pipe = pickle.load(open(os.path.join(ARTIFACTS_DIR, 'pipe.pkl'), 'rb'))
df = pickle.load(open(os.path.join(ARTIFACTS_DIR, 'df.pkl'), 'rb'))

# Mount static files (frontend)
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "frontend")), name="static")

# Pydantic model for prediction request
class LaptopConfig(BaseModel):
    company: str
    laptop_type: str
    ram: int
    weight: float
    touchscreen: str
    ips: str
    screen_size: float
    resolution: str
    cpu: str
    hdd: int
    ssd: int
    gpu: str
    os: str

# Market standard dropdown options
SCREEN_SIZES = [
    {"label": "11.6 inch", "value": 11.6},
    {"label": "12.0 inch", "value": 12.0},
    {"label": "12.5 inch", "value": 12.5},
    {"label": "13.3 inch", "value": 13.3},
    {"label": "13.5 inch", "value": 13.5},
    {"label": "14.0 inch", "value": 14.0},
    {"label": "15.0 inch", "value": 15.0},
    {"label": "15.4 inch", "value": 15.4},
    {"label": "15.6 inch", "value": 15.6},
    {"label": "16.0 inch", "value": 16.0},
    {"label": "17.0 inch", "value": 17.0},
    {"label": "17.3 inch", "value": 17.3},
    {"label": "18.4 inch", "value": 18.4},
]

WEIGHTS = [
    {"label": "0.9 kg (Ultra-light)", "value": 0.9},
    {"label": "1.0 kg", "value": 1.0},
    {"label": "1.2 kg", "value": 1.2},
    {"label": "1.3 kg", "value": 1.3},
    {"label": "1.4 kg", "value": 1.4},
    {"label": "1.5 kg", "value": 1.5},
    {"label": "1.6 kg", "value": 1.6},
    {"label": "1.8 kg", "value": 1.8},
    {"label": "2.0 kg", "value": 2.0},
    {"label": "2.2 kg", "value": 2.2},
    {"label": "2.4 kg", "value": 2.4},
    {"label": "2.5 kg", "value": 2.5},
    {"label": "2.7 kg", "value": 2.7},
    {"label": "3.0 kg", "value": 3.0},
    {"label": "3.5 kg (Heavy)", "value": 3.5},
    {"label": "4.0 kg (Desktop Replacement)", "value": 4.0},
]

RAM_OPTIONS = [2, 4, 6, 8, 12, 16, 24, 32, 64]
HDD_OPTIONS = [0, 128, 256, 512, 1024, 2048]
SSD_OPTIONS = [0, 8, 128, 256, 512, 1024]
RESOLUTION_OPTIONS = [
    "1920x1080", "1366x768", "1600x900", "3840x2160", 
    "3200x1800", "2880x1800", "2560x1600", "2560x1440", "2304x1440"
]

@app.get("/", response_class=HTMLResponse)
async def serve_home():
    """Serve the main HTML page"""
    html_path = os.path.join(BASE_DIR, "frontend", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/options")
async def get_options():
    """Get all dropdown options for the form"""
    return {
        "companies": df['Company'].unique().tolist(),
        "laptop_types": df['TypeName'].unique().tolist(),
        "ram": RAM_OPTIONS,
        "screen_sizes": SCREEN_SIZES,
        "weights": WEIGHTS,
        "resolutions": RESOLUTION_OPTIONS,
        "cpus": df['Cpu brand'].unique().tolist(),
        "hdd": HDD_OPTIONS,
        "ssd": SSD_OPTIONS,
        "gpus": df['Gpu brand'].unique().tolist(),
        "os_options": df['os'].unique().tolist()
    }

@app.post("/api/predict")
async def predict_price(config: LaptopConfig):
    """Predict laptop price based on configuration"""
    try:
        # Validate inputs
        if config.weight <= 0 or config.screen_size <= 0:
            raise HTTPException(
                status_code=400, 
                detail="Weight and Screen Size must be greater than 0"
            )
        
        # Convert touchscreen and IPS to integers
        touchscreen = 1 if config.touchscreen == 'Yes' else 0
        ips = 1 if config.ips == 'Yes' else 0
        
        # Calculate PPI (Pixels Per Inch)
        X_res = int(config.resolution.split('x')[0])
        Y_res = int(config.resolution.split('x')[1])
        ppi = ((X_res**2) + (Y_res**2))**0.5 / config.screen_size
        
        # Create query dataframe
        query = pd.DataFrame(
            [[config.company, config.laptop_type, config.ram, config.weight, 
              touchscreen, ips, ppi, config.cpu, config.hdd, config.ssd, 
              config.gpu, config.os]],
            columns=['Company', 'TypeName', 'Ram', 'Weight', 'Touchscreen', 
                     'Ips', 'ppi', 'Cpu brand', 'HDD', 'SSD', 'Gpu brand', 'os']
        )
        
        # Make prediction
        log_price = pipe.predict(query)[0]
        predicted_price = int(np.exp(log_price))
        
        return {
            "success": True,
            "predicted_price": predicted_price,
            "formatted_price": f"₹{predicted_price:,}",
            "configuration": {
                "brand": config.company,
                "type": config.laptop_type,
                "ram": f"{config.ram} GB",
                "weight": f"{config.weight} kg",
                "screen_size": f"{config.screen_size} inch",
                "resolution": config.resolution,
                "touchscreen": config.touchscreen,
                "ips": config.ips,
                "cpu": config.cpu,
                "hdd": f"{config.hdd} GB" if config.hdd > 0 else "None",
                "ssd": f"{config.ssd} GB" if config.ssd > 0 else "None",
                "gpu": config.gpu,
                "os": config.os
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "LaptopGenius API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
