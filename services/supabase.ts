
import { createClient } from '@supabase/supabase-js';
import { PixReport, ScamCategory } from '../types';

// Chaves de demonstração - Em produção, estas chaves seriam reais e apontariam para um banco persistente
const SUPABASE_URL = 'https://imljvecfupxoolojbrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_key'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEST_DATA = [
  { 
    "hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3", 
    "status": "perigo", 
    "motivo": "5 denúncias com B.O. confirmado" 
  },
  { 
    "hash": "ef710810793740e2b96874e4479e000490f23078a666e84d4da55d3780517812", 
    "status": "aviso", 
    "motivo": "2 denúncias recentes" 
  }
];

const LOCAL_STORAGE_KEY = 'pixsafe_v1_reports';

export const pixService = {
  async getReportsByHash(hash: string) {
    // Busca primeiro o que está no banco local do navegador
    const localReports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const filteredLocal = localReports.filter((r: any) => r.key_hash === hash);
    
    // Verifica se é uma das chaves de teste (hardcoded)
    const testRecord = TEST_DATA.find(d => d.hash === hash);

    try {
      const { data, error } = await supabase
        .from('denuncias')
        .select('*')
        .eq('key_hash', hash);
      
      if (error) throw error;
      
      return { 
        testRecord, 
        dbRecords: [...(data as PixReport[] || []), ...filteredLocal] 
      };
    } catch (err) {
      // Se o Supabase falhar (o que é esperado com a chave dummy), usamos apenas o local
      return { 
        testRecord, 
        dbRecords: filteredLocal 
      };
    }
  },

  async createReport(hash: string, category: ScamCategory, hasBo: boolean): Promise<boolean> {
    const newReport = { 
      key_hash: hash, 
      category: category, 
      has_bo: hasBo, 
      created_at: new Date().toISOString() 
    };

    try {
      // Tentativa oficial (falhará com chave dummy)
      const { error } = await supabase
        .from('denuncias')
        .insert([newReport]);
      
      if (error) throw error;
      console.log('✅ Denúncia salva no banco em nuvem.');
    } catch (err) {
      // Mecanismo de Persistência Local (LocalStorage)
      const localReports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      localReports.push(newReport);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReports));
      
      console.warn('💾 Nota: Usando LocalStorage (Persistência no Navegador).');
      console.info('A denúncia foi salva com sucesso neste dispositivo.');
    }
    
    return true;
  }
};
