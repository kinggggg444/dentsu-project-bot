# DENTSU MD V10

<p align="center">
  <img src="https://raw.githubusercontent.com/kinggggg444/DENTSU-MD-V10/main/assets/bot-avatar.png" alt="DENTSU MD V10" width="300" style="border-radius:20px"/>
</p>

<p align="center">
  <b>Bot WhatsApp multi-sessions • 200+ commandes • by Natsu Tech</b>
</p>

<p align="center">
  <a href="https://whatsapp.com/channel/0029VbC1s7fFnSz1YhZYc01h">
    <img src="https://img.shields.io/badge/Canal_WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Canal WhatsApp"/>
  </a>
  <a href="https://chat.whatsapp.com/GtXASqDdchAFvEJ95cQQ0F">
    <img src="https://img.shields.io/badge/Groupe_WhatsApp-128C7E?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Groupe WhatsApp"/>
  </a>
  <a href="https://t.me/Natsu_or_Dentsu">
    <img src="https://img.shields.io/badge/Telegram-0088cc?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/>
  </a>
</p>

---

## Fonctionnalités

- Connexion WhatsApp par code de jumelage, sans QR code
- Plusieurs sessions WhatsApp sur la même instance
- Site web de jumelage et endpoints `/health` et `/status`
- Restauration automatique des sessions présentes au redémarrage
- Suivi automatique du canal et adhésion automatique au groupe configuré après connexion
- Commandes de groupe, propriétaire, médias, téléchargements, recherche, jeux et outils
- Configuration par variables d'environnement

## Prérequis

- Node.js 20.x ou Docker
- Un numéro WhatsApp actif pour le jumelage
- Un hébergeur capable de garder un service web actif

## Lancer en local

```bash
npm install
cp .env.example .env
npm start
```

Ouvre ensuite `http://localhost:3000`. Le contrôle de santé est disponible sur
`http://localhost:3000/health`.

Pour le développement :

```bash
npm run dev
```

## Variables d'environnement

Toutes les variables disponibles sont documentées dans [`.env.example`](.env.example).
Les plus importantes sont :

| Variable | Rôle | Exemple |
| --- | --- | --- |
| `PORT` | Port HTTP fourni par l'hébergeur | `3000` |
| `OWNER_NUMBER` | Numéro du propriétaire avec indicatif, sans `+` | `242065121108` |
| `MODE` | Mode de fonctionnement | `public` |
| `MAX_SESSIONS` | Nombre maximal de sessions | `50` |
| `SESSION_BASE_PATH` | Dossier de sauvegarde des sessions | `./session` |
| `WEBSITE` | URL publique du service | `https://mon-bot.example` |
| `WEBSITE_DISPLAY` | Adresse courte affichée dans le menu WhatsApp | `dentsu-md-v10.onrender.com` |
| `AUTO_FOLLOW_CHANNEL` | Suit automatiquement le canal configuré | `true` |
| `AUTO_JOIN_GROUP` | Rejoint automatiquement le groupe configuré | `true` |
| `AUTO_JOIN_DELAY_MS` | Délai avant la tentative de rejoindre le groupe | `5000` |
| `GIFTEDTECH_API_KEY` | Clé optionnelle des endpoints GiftedTech | — |
| `THRESAV_API_KEY` | Clé optionnelle du convertisseur YouTube MP4 | — |
| `NEXORACLE_API_KEY` | Clé des commandes GFX/logo | — |

Ne publie jamais ton fichier `.env`. Les dossiers `session/` et `tmp/` sont
également ignorés par Git.

### API intégrées

Les commandes utilisent les endpoints du fichier API fourni avec des fallbacks :

| Commandes | Fonction |
| --- | --- |
| `.play`, `.song`, `.ytmp3` | Recherche et téléchargement audio YouTube |
| `.playdoc` | Envoie l'audio en document |
| `.spotify` | Recherche et téléchargement Spotify |
| `.video`, `.ytb`, `.yt`, `.youtube`, `.videodoc`, `.ytmp4` | Téléchargement vidéo YouTube |
| `.tiktok` | Téléchargement TikTok |
| `.fb` | Téléchargement Facebook |
| `.yts` | Recherche YouTube |
| `.achar`, `.character` | Recherche de personnages via Jikan |
| `.apk` | Recherche et envoi d'un APK |
| `.catbox`, `.tourl`, `.url` | Upload Catbox |
| `.gfx*` et les commandes de styles | Génération d'images et de logos |
| `.ai`, `.gpt` et alias IA | Chat via ChatEverywhere |

Les API publiques gratuites peuvent changer, limiter les requêtes ou devenir
indisponibles. Le bot essaie plusieurs fournisseurs quand c'est possible et
retourne une erreur lisible si tous échouent. Les clés ne sont pas incluses
dans le dépôt : ajoute-les uniquement dans les variables privées de Render.

## Déploiement avec Render

Le dépôt contient déjà [`render.yaml`](render.yaml) et un `Dockerfile`.

1. Fais un fork du dépôt ou connecte directement ton dépôt GitHub à [Render](https://render.com).
2. Choisis **New → Blueprint** et sélectionne le dépôt.
3. Render détectera `render.yaml`, construira l'image Docker et utilisera `npm start`.
4. Vérifie la variable `OWNER_NUMBER` dans les paramètres du service.
5. Ajoute les clés API optionnelles si tu veux activer les fournisseurs qui les exigent.
6. Après le déploiement, ouvre l'URL Render et vérifie `/health`.
7. Ouvre ensuite la page d'accueil pour demander le code de jumelage.

Le fichier ne fixe volontairement pas `PORT` dans Render : la plateforme fournit
elle-même le port attendu par le service.

### Limite du forfait gratuit Render

Le service gratuit peut être mis en veille et son stockage local est éphémère.
Pour un bot WhatsApp, cela peut déconnecter ou effacer les sessions après un
redémarrage. Utilise un disque persistant et une formule toujours active si tu
veux conserver les sessions de façon fiable.

## Déploiement avec Railway

Le dépôt contient [`railway.json`](railway.json) et le même `Dockerfile`.

1. Crée un projet Railway depuis ce dépôt GitHub.
2. Railway détectera `railway.json` et construira le `Dockerfile`.
3. Ajoute au minimum `OWNER_NUMBER`, `MODE=public` et `MAX_SESSIONS`.
4. Configure un volume persistant monté sur `/app/session`.
5. Vérifie le healthcheck `/health`.
6. Ouvre le domaine public Railway et demande le code de jumelage.

Railway facture selon l'utilisation après les crédits ou la période d'essai
applicables au compte. Vérifie les conditions actuelles de ton compte avant de
laisser le service fonctionner en continu.

## Autres options

Le `Dockerfile` permet aussi d'utiliser tout hébergeur qui accepte un
conteneur Docker et un service HTTP permanent. Pour ce bot, privilégie un
hébergeur avec :

- un processus toujours actif ;
- un volume persistant pour `/app/session` ;
- un port HTTP injecté via `PORT` ;
- un healthcheck HTTP sur `/health`.

Les plateformes gratuites qui mettent le service en veille ou suppriment le
disque local conviennent seulement pour des essais, pas pour une session
WhatsApp durable.

## Vérification après déploiement

```bash
curl https://TON-DOMAINE/health
```

La réponse attendue ressemble à :

```json
{"status":"ok","bot":"DENTSU MD V10","sessions":0,"uptime":12}
```

Si le healthcheck répond correctement, ouvre `https://TON-DOMAINE/` et suis les
instructions de jumelage affichées.

## Catégories de commandes

| Catégorie | Exemples | Menu |
| --- | --- | --- |
| AI | `.gpt`, `.gemini`, `.deepseek` | `.aimenu` |
| Group | `.tagall`, `.kick`, `.promote` | `.groupmenu` |
| Owner | `.broadcast`, `.mode`, `.block` | `.ownermenu` |
| Fun | `.truth`, `.dare`, `.ship` | `.funmenu` |
| Game | `.rps`, `.hangman`, `.math` | `.gamemenu` |
| Sound | `.tts`, `.say`, `.bass` | `.soundmenu` |
| Download | `.ytmp3`, `.fb`, `.insta` | `.dlmenu` |
| Media | `.sticker`, `.remini` | `.mediamenu` |
| Search | `.img`, `.yts`, `.github` | `.searchmenu` |
| Anime | `.neko`, `.manga`, `.lyrics` | `.animemenu` |

## Liens

- Canal 1 : https://whatsapp.com/channel/0029VayOeIbGufIvDPhi6m1X
- Canal 2 : https://whatsapp.com/channel/0029VbC1s7fFnSz1YhZYc01h
- Groupe : https://chat.whatsapp.com/GtXASqDdchAFvEJ95cQQ0F
- Telegram : https://t.me/Natsu_or_Dentsu

---

<p align="center">Made with ❤️ by <b>Natsu Tech</b></p>