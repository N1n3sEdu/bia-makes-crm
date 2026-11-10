from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

class VariationCreate(BaseModel):
    name: str
    color_hex: Optional[str] = None
    sku: str
    stock: int = 0

class VariationOut(VariationCreate):
    id: str
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    sku: str
    ean: Optional[str] = None
    category_id: Optional[str] = None
    brand: str = "Bia Makes"
    cost_price: float
    sale_price: float
    promo_price: Optional[float] = None
    physical_stock: int = 0
    min_stock: int = 10
    batch: Optional[str] = None
    expiry_date: Optional[date] = None
    description: Optional[str] = None

class ProductCreate(ProductBase):
    variations: Optional[List[VariationCreate]] = []

class ProductOut(ProductBase):
    id: str
    reserved_stock: int
    created_at: datetime
    variations: List[VariationOut] = []
    class Config:
        from_attributes = True

class StockAdjustmentRequest(BaseModel):
    product_id: str
    type: str # ENTRADA, SAIDA, AJUSTE, DEVOLUCAO
    quantity: int
    reason: str
    operator_name: str

class WebhookOrderPayload(BaseModel):
    event_id: str
    channel_code: str # MERCADO_LIVRE, SHOPEE, AMAZON, TIKTOK
    order_number: str
    customer_name: str
    total_amount: float
    items: List[dict]
