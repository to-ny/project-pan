import { validateToken } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const authenticated = validateToken(req);
  return res.status(200).json({ authenticated });
}
