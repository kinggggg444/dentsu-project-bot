const axios = require('axios');

const http = axios.create({
  timeout: 30000,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'Dentsu-Project-Website',
  },
});

function extractAnswer(value) {
  if (typeof value === 'string' && value.trim()) {
    const text = value.trim();
    if (/<(?:html|head|body|script)\b|<!doctype/i.test(text)) return '';
    if (text.length > 6000) return '';
    return text;
  }
  if (!value || typeof value !== 'object') return '';

  const direct = [
    value.answer,
    value.response,
    value.message,
    value.content,
    value.text,
    value?.choices?.[0]?.message?.content,
    value?.choices?.[0]?.text,
  ];
  const found = direct.find((item) => typeof item === 'string' && item.trim());
  if (found) return found.trim();

  for (const child of Object.values(value)) {
    const nested = extractAnswer(child);
    if (nested) return nested;
  }
  return '';
}

function localDentsuAnswer(prompt) {
  const text = prompt.toLowerCase();
  if (/\b(pair|pairing|jumelage|code|qr)\b/.test(text)) {
    return 'Pour connecter WhatsApp : ouvre le pairing DENTSU, saisis ton numéro avec l’indicatif pays, puis dans WhatsApp ouvre Appareils connectés → Connecter un appareil → Connecter avec un numéro de téléphone. Entre le code affiché ici et garde WhatsApp à jour.';
  }
  if (/\b(audio|musique|chanson|song|télécharg|download)\b/.test(text)) {
    return 'Utilise le studio audio du site avec un titre ou un lien vidéo. Télécharge uniquement les contenus que tu as le droit d’enregistrer, puis ouvre le lien obtenu sur ton téléphone Android.';
  }
  if (/\b(support|déban|banni|ban|bloqu|compte)\b/.test(text)) {
    return 'Pour un compte restreint, évite les tentatives répétées et contacte le support officiel WhatsApp depuis l’application. Le formulaire DENTSU prépare un résumé clair, mais ne promet pas un déblocage automatique.';
  }
  if (/\b(diagnostic|sécur|sécurité|problème|erreur)\b/.test(text)) {
    return 'Lance le diagnostic sûr avec le numéro au format international et une courte description. Il ne contacte pas le numéro : il prépare seulement une checklist de dépannage et une référence de support.';
  }
  return '';
}

async function askDentsuAI(prompt) {
  const guardedPrompt = [
    'You are the official DENTSU PROJECT BOT website assistant.',
    'Answer clearly and briefly in the language used by the visitor.',
    'Help with WhatsApp pairing, safe bot usage, audio downloads, and support.',
    'Never provide instructions for crashing, spamming, attacking, banning, or disrupting accounts or devices.',
    `Visitor question: ${prompt}`,
  ].join('\n');

  const requests = [
    () => http.post('https://chateverywhere.app/api/chat/', {
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 32000,
        tokenLimit: 8000,
        completionTokenLimit: 5000,
        deploymentName: 'gpt-4',
      },
      messages: [{ pluginId: null, role: 'user', content: guardedPrompt }],
      prompt: guardedPrompt,
      temperature: 0.5,
    }),
    () => http.get(`https://api.simsimi.vip/v1/simtalk?text=${encodeURIComponent(guardedPrompt)}&lc=fr`),
    () => http.get(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(guardedPrompt)}`),
  ];

  let lastError;
  for (const request of requests) {
    try {
      const response = await request();
      const answer = extractAnswer(response.data) || response.data?.success;
      if (typeof answer === 'string' && answer.trim()) return answer.trim();
    } catch (error) {
      lastError = error;
    }
  }
  const localAnswer = localDentsuAnswer(prompt);
  if (localAnswer) return localAnswer;
  throw lastError || new Error('The AI providers returned no answer.');
}

module.exports = { askDentsuAI };