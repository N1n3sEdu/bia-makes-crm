import { getDatabase } from '@netlify/database';

/**
 * Retorna a instância do Netlify Database de forma segura.
 * Retorna null se não houver banco configurado ou se ocorrer erro na inicialização.
 */
export function getAnalyticsDb() {
  try {
    // getDatabase() seleciona automaticamente a conexão do ambiente Netlify
    return getDatabase();
  } catch (error) {
    console.warn('[Analytics DB] Não foi possível inicializar conexão com Netlify Database:', error);
    return null;
  }
}
