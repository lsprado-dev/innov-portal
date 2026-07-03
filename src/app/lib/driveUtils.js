import { drive } from './googleDrive';

const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

/**
 * Cria a estrutura espelho perfeita para um cliente dentro do Drive Compartilhado
 * @param {string} nomeEmpresa Nome da empresa do cliente
 * @param {string} tipoConta 'mensalista' ou 'especiais'
 * @returns {object} Objeto contendo os IDs de todas as pastas criadas
 */
export async function criarEstruturaClienteDrive(nomeEmpresa, tipoConta = 'mensalista') {
  try {
    // 1. Cria a pasta principal do cliente
    const pastaClienteResponse = await drive.files.create({
      requestBody: {
        name: nomeEmpresa,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [ROOT_ID],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const pastaClienteId = pastaClienteResponse.data.id;

    // 2. Define as subpastas dependendo do tipo de conta
    let subpastas = [];
    if (tipoConta === 'especiais' || tipoConta === 'especial') {
      // Pastas do Societário (Pode alterar os nomes se quiser!)
      subpastas = ['Documentos Recebidos', 'Processos', 'Taxas e Guias', 'Lixeira'];
    } else {
      // Pastas do Mensalista
      subpastas = ['Contábil', 'Fiscal', 'DP - RH', 'Documentos Recebidos', 'Lixeira'];
    }

    const mapeamentoIds = {
      pasta_raiz_cliente: pastaClienteId
    };

    // 3. Cria as subpastas
    for (const subpasta of subpastas) {
      const subResponse = await drive.files.create({
        requestBody: {
          name: subpasta,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [pastaClienteId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      const chaveAmigavel = `pasta_${subpasta.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      mapeamentoIds[chaveAmigavel] = subResponse.data.id;
    }

    return { success: true, folders: mapeamentoIds };

  } catch (error) {
    console.error('Erro ao gerar estrutura no Google Drive:', error);
    return { success: false, error: error.message };
  }
}