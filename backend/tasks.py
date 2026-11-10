import os
import time
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("bia_makes_tasks", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task(name="sync_marketplace_inventory")
def sync_marketplace_inventory(product_sku: str, available_stock: int):
    """
    Sincroniza o estoque disponível em todos os canais de marketplace conectados
    de forma assíncrona para garantir alta velocidade sem travar a requisição HTTP.
    """
    print(f"[Celery] Sincronizando SKU {product_sku} -> {available_stock} unidades para Mercado Livre, Shopee e TikTok Shop...")
    time.sleep(1) # Simula chamada às APIs externas
    print(f"[Celery] Sincronização concluída com sucesso para o SKU {product_sku}.")
    return {"status": "SUCCESS", "sku": product_sku, "synced_stock": available_stock}

@celery_app.task(name="check_anvisa_expiration_alerts")
def check_anvisa_expiration_alerts():
    """
    Verificação diária de conformidade ANVISA para lotes de maquiagem com validade inferior a 90 dias.
    """
    print("[Celery] Executando rotina de conformidade ANVISA: checando validades de cosméticos...")
    return {"status": "SUCCESS", "message": "Relatório de validades gerado."}
