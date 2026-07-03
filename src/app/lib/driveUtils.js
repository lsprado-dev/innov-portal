import { drive } from './googleDrive';

const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

/**
 * Cria a estrutura espelho perfeita para um cliente dentro do Drive Compartilhado
 * @param {string} nomeEmpresa Nome da empresa do cliente
 * @returns {object} Objeto contendo os IDs de todas as pastas criadas
 */
export async function criarEstruturaClienteDrive(nomeEmpresa) {
  try {
    // 1. Cria a pasta principal do cliente dentro do Drive Compartilhado
    const pastaClienteResponse = await drive.files.create({
      requestBody: {
        name: nomeEmpresa,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [ROOT_ID],
      },
      fields: 'id',
      supportsAllDrives: true, // OBRIGATÓRIO para Drive Compartilhado
    });

    const pastaClienteId = pastaClienteResponse.data.id;

    // Subpastas que você determinou como padrão
    const subpastasPadrao = [
      'Contábil',
      'Fiscal',
      'DP - RH',
      'Documentos Recebidos',
      'Lixeira'
    ];

    const mapeamentoIds = {
      pasta_raiz_cliente: pastaClienteId
    };

    // 2. Cria as subpastas em lote dentro da pasta do cliente
    for (const subpasta of subpastasPadrao) {
      const subResponse = await drive.files.create({
        requestBody: {
          name: subpasta,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [pastaClienteId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      // Transforma o nome da pasta em uma chave amigável (ex: 'Fiscal' vira 'pasta_fiscal')
      const chaveAmigavel = `pasta_${subpasta.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      mapeamentoIds[chaveAmigavel] = subResponse.data.id;
    }

    // Retorna todos os IDs gerados para salvarmos no banco de dados
    return { success: true, folders: mapeamentoIds };

  } catch (error) {
    console.error('Erro ao gerar estrutura no Google Drive:', error);
    return { success: false, error: error.message };
  }
}