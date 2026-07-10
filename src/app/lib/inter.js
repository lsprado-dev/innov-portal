import axios from 'axios';
import https from 'https';

export async function getInterToken() {
  const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
  const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');

  const httpsAgent = new https.Agent({ cert, key });

  const response = await axios.post(
    'https://cdws.inter.co/oauth/v2/token',
    new URLSearchParams({
      client_id: process.env.INTER_CLIENT_ID,
      client_secret: process.env.INTER_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'boleto-cobranca.read boleto-cobranca.write'
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      httpsAgent
    }
  );

  return response.data.access_token;
}