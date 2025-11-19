# Bataille Royale - App mobile (React Native / Expo)

## Lancer l’app mobile

Dans un terminal à la racine du projet :

```bash
cd mobile
npm install  # (déjà fait une fois, à relancer si besoin)
npm start    # ou: npx expo start
```

Ensuite :
- scanner le QR code avec l’app **Expo Go** sur téléphone, ou
- lancer un émulateur iOS / Android depuis l’interface Expo.

## Fonctionnalités

- Écran **Home** : choix de mode (Amical / Classé), langue FR/EN, affichage ELO et amis fictifs.
- Écran **Game** : jeu de bataille contre un bot, mécanique de "bataille" (war), pot de cartes, messages dynamiques.
- Écran **Stats** : ELO, winrate, séries, cartes gagnées, historique des parties.
- Stats persistées en local via **AsyncStorage**.

## SQL / Supabase

Le fichier `supabase/schema.sql` contient :
- table `profiles` : profil joueur, ELO, pays.
- table `matches` : parties entre deux joueurs, gagnant, ELO avant/après.
- table `match_rounds` : rounds détaillés d’une partie.
- vue `leaderboard` : classement par ELO.
- RLS activé + quelques policies génériques à adapter.

Intégration non encore câblée dans l’app mobile :
- actuellement le jeu fonctionne **offline** (bot + stats locales).
- pour un vrai multi en ligne, il faudra :
  - configurer un client Supabase dans l’app mobile (URL + clé anon),
  - mapper les stats locales vers les tables `profiles` / `matches`,
  - décider du modèle temps réel (channels / Realtime, ou API custom).
