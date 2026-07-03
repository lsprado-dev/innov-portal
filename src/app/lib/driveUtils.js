import { drive } from './googleDrive';

const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

/**
 * Função auxiliar para buscar ou criar uma pasta organizadora (Mensalistas ou Societário)
 */
async function obterOuCriarPastaPaiSetor(nomeSetor) {
  try {
    // 1. Procura se a pasta (ex: "Mensalistas") já existe dentro da Portal Innovative
    const response = await drive.files.list({
      q: `name = '${nomeSetor}' and '${ROOT_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // 2. Se não existir, cria ela na hora
    const novaPastaSetor = await drive.files.create({
      requestBody: {
        name: nomeSetor,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [ROOT_ID],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    return novaPastaSetor.data.id;
  } catch (error) {
    console.error(`Erro ao obter/criar pasta pai ${nomeSetor}:`, error);
    throw error;
  }
}

/**
 * Cria a estrutura espelho perfeita para um cliente dividindo em Mensalistas e Societário
 */
export async function criarEstruturaClienteDrive(nomeEmpresa, tipoConta = 'mensalista') {
  try {
    let pastaPaiSetorId = null;
    let subpastas = [];
    const isSocietario = tipoConta === 'especiais' || tipoConta === 'especial';

    // MÁGICA 1: Define a rota e o destino com base no tipo de conta
    if (isSocietario) {
      pastaPaiSetorId = await obterOuCriarPastaPaiSetor('Societário');
      // No societário o cliente não tem pastas fixas de setores, os processos viram pastas depois!
      subpastas = ['Documentos Recebidos', 'Lixeira']; 
    } else {
      pastaPaiSetorId = await obterOuCriarPastaPaiSetor('Mensalistas');
      // Pastas fixas do Mensalista
      subpastas = ['Contábil', 'Fiscal', 'DP - RH', 'Documentos Recebidos', 'Lixeira'];
    }

    // 2. Cria a pasta da Empresa dentro da pasta pai correta (Mensalistas ou Societário)
    const pastaClienteResponse = await drive.files.create({
      requestBody: {
        name: nomeEmpresa,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [pastaPaiSetorId], // ➔ JOGA DENTRO DA PASTA DO SETOR!
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const pastaClienteId = pastaClienteResponse.data.id;

    const mapeamentoIds = {
      pasta_raiz_cliente: pastaClienteId
    };

    // 3. Cria as subpastas internas da empresa
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

      const chaveAmigavel = `pasta_${subpasta.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
      mapeamentoIds[chaveAmigavel] = subResponse.data.id;
    }

    return { success: true, folders: mapeamentoIds };

  } catch (error) {
    console.error('Erro ao gerar estrutura no Google Drive:', error);
    return { success: false, error: error.message };
  }
}