import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Numeric, Integer, Boolean, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="ADMIN") # ADMIN, GERENTE, ESTOQUE, VENDAS, FINANCEIRO
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(80), unique=True, nullable=False)
    slug = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    sku = Column(String(60), unique=True, nullable=False, index=True)
    ean = Column(String(14), unique=True, nullable=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    brand = Column(String(80), default="Bia Makes")
    cost_price = Column(Numeric(10, 2), default=0.00)
    sale_price = Column(Numeric(10, 2), default=0.00)
    promo_price = Column(Numeric(10, 2), nullable=True)
    physical_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=10)
    batch = Column(String(60), nullable=True) # Lote ANVISA
    expiry_date = Column(Date, nullable=True)  # Validade ANVISA
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    variations = relationship("ProductVariation", back_populates="product", cascade="all, delete-orphan")

class ProductVariation(Base):
    __tablename__ = "product_variations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False) # Ex: 'Tom 01'
    color_hex = Column(String(7), nullable=True) # Ex: '#F6E6DA'
    sku = Column(String(60), unique=True, nullable=False)
    stock = Column(Integer, default=0)

    product = relationship("Product", back_populates="variations")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    type = Column(String(30), nullable=False) # ENTRADA, SAIDA, RESERVA, AJUSTE, DEVOLUCAO
    quantity = Column(Integer, nullable=False)
    previous_stock = Column(Integer, nullable=False)
    current_stock = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    operator_name = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketplaceChannel(Base):
    __tablename__ = "marketplace_channels"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(40), unique=True, nullable=False) # MERCADO_LIVRE, SHOPEE, AMAZON, TIKTOK, SITE
    name = Column(String(80), nullable=False)
    account_name = Column(String(120), nullable=True)
    status = Column(String(30), default="DESCONECTADO")
    fee_percentage = Column(Numeric(5, 2), default=0.00)
    last_sync = Column(DateTime, nullable=True)

class Order(Base):
    __tablename__ = "orders"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(60), unique=True, nullable=False)
    channel_id = Column(String(36), ForeignKey("marketplace_channels.id"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(180), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    total_amount = Column(Numeric(10, 2), default=0.00)
    status = Column(String(30), default="PENDENTE") # PENDENTE, PAGO, SEPARACAO, ENVIADO, CONCLUIDO, CANCELADO
    payment_method = Column(String(80), nullable=True)
    shipping_address = Column(Text, nullable=True)
    idempotency_key = Column(String(120), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
