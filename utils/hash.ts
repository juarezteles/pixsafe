
/**
 * Gera um hash SHA-256 de uma string localmente seguindo as normas de segurança.
 * 
 * 1. Remove TODOS os espaços, pontos, traços, parênteses e outros caracteres de formatação.
 * 2. Utiliza a WebCrypto API (crypto.subtle.digest) para processamento.
 * 3. Converte o ArrayBuffer resultante em uma String Hexadecimal.
 */
export async function generateSHA256(message: string): Promise<string> {
  // Sanitização Robusta: Remove TUDO que não for letra ou número
  // Isso garante que (11) 99999-9999 e 11999999999 gerem o mesmo HASH
  const sanitized = message.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Converte a string sanitizada em um buffer de bytes
  const msgBuffer = new TextEncoder().encode(sanitized);
  
  // Gera o hash SHA-256 (retorna um ArrayBuffer)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Converte o buffer resultante em uma String Hexadecimal amigável para comparação
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Valida se a entrada corresponde a um formato de chave Pix válido.
 * Formatos suportados: CPF, E-mail, Telefone (celular) e Chave Aleatória (UUID).
 */
export function isValidPixKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  // 1. Validação de Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) return true;

  // 2. Validação de CPF/CNPJ/Telefone (apenas números)
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && digitsOnly.length <= 14) return true;

  // 3. Validação de Chave Aleatória (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const uuidSimpleRegex = /^[0-9a-f]{32}$/i;
  if (uuidRegex.test(trimmed) || uuidSimpleRegex.test(trimmed)) return true;

  return false;
}

/**
 * Calcula o nível de risco baseado em score numérico.
 * Lógica: (Denúncias * 10) + (Denúncias com B.O. * 25)
 */
export function calculateRisk(reportCount: number, policeReportCount: number) {
  const score = (reportCount * 10) + (policeReportCount * 25);
  
  if (score === 0) return { level: 'SAFE', score };
  if (score < 20) return { level: 'LOW', score };
  if (score < 50) return { level: 'MEDIUM', score };
  if (score < 100) return { level: 'HIGH', score };
  return { level: 'CRITICAL', score };
}
