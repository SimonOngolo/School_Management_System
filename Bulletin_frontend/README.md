# LP ASUR — Frontend de Gestion des Bulletins

> Plateforme web de gestion des bulletins de notes de la Licence Professionnelle ASUR à l'INPTIC.

---

## Stack technique

| Technologie | Rôle |
|-------------|------|
| React 19 + TypeScript | Framework UI |
| TanStack Router | Routage file-based |
| TanStack React Query | Gestion des requêtes serveur |
| Axios | Client HTTP (API backend) |
| shadcn/ui + Radix UI | Composants accessibles |
| TailwindCSS v4 | Utilitaires CSS |
| Vite 7 | Bundler et dev server |
| Zod + React Hook Form | Validation de formulaires |
| Recharts | Graphiques |
| Sonner | Notifications toast |

---

## Prérequis

- **Node.js** ≥ 18
- **npm** ou **bun**
- Le **backend** doit tourner sur `http://localhost:3000` (voir `backend/README.md`)

---

## Installation et démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
# → http://localhost:5173

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

### Variable d'environnement

Créer un fichier `.env` à la racine du frontend :

```env
VITE_API_URL=http://localhost:3000/api
```

Si absent, l'URL par défaut est `http://localhost:3000/api`.

---

## Structure du projet

```
src/
├── components/
│   ├── AppLayout.tsx          # Layout principal (sidebar + header)
│   ├── ProtectedRoute.tsx     # Guard d'authentification et rôles
│   ├── ui/                    # 46 composants shadcn/ui
│   └── ui-kit.tsx             # StatCard, PageHeader (réutilisables)
│
├── lib/
│   ├── api.ts                 # Client Axios (baseURL + interceptors JWT)
│   ├── auth.tsx               # AuthProvider + useAuth (context React)
│   └── utils.ts               # cn() (merge de classes Tailwind)
│
├── routes/                    # Pages = fichiers (TanStack Router)
│   ├── __root.tsx             # Racine : QueryClient + AuthProvider + Toaster
│   ├── index.tsx              # / → redirige vers /dashboard ou /login
│   ├── login.tsx              # /login
│   ├── dashboard.tsx          # /dashboard
│   ├── students.tsx           # /students
│   ├── grades.tsx             # /grades
│   ├── absences.tsx           # /absences
│   ├── bulletins.tsx          # /bulletins
│   ├── imports.tsx            # /imports (import Excel)
│   ├── exports.tsx            # /exports (export Excel)
│   └── curriculum.tsx         # /curriculum (programmes)
│
├── router.tsx                 # Configuration du routeur
├── routeTree.gen.ts           # Arbre auto-généré (ne pas modifier)
└── styles.css                 # Variables CSS + styles globaux
```

---

## Routage

Le routage est **file-based** : chaque fichier dans `src/routes/` devient une route.

| Page | Route | Description | Rôles |
|------|-------|-------------|-------|
| Tableau de bord | `/dashboard` | Statistiques et vue d'ensemble | Tous |
| Étudiants | `/students` | Gestion des étudiants (CRUD) | admin, secretariat, teacher |
| Notes | `/grades` | Saisie et consultation des notes | Tous (lecture/écriture selon rôle) |
| Absences | `/absences` | Gestion des absences | admin, secretariat |
| Bulletins | `/bulletins` | Consultation et téléchargement PDF | admin, secretariat, student |
| Imports | `/imports` | Import Excel (notes et étudiants) | admin, secretariat |
| Exports | `/exports` | Export Excel (jury et relevés) | admin, secretariat |
| **Programmes** | **`/curriculum`** | **Gestion des semestres, UE et matières** | **admin, secretariat** |

---

## Authentification

### Flux

1. L'utilisateur se connecte sur `/login` avec email + mot de passe
2. Le frontend appelle `POST /api/auth/login` sur le backend
3. Le backend retourne un token JWT + les infos utilisateur
4. Le token et l'utilisateur sont stockés dans `localStorage`
5. Chaque requête suivante inclut `Authorization: Bearer <token>`
6. Si une réponse 401 est reçue → déconnexion automatique

### Fallback démo

Si le backend est injoignable, 4 comptes de démonstration fonctionnent en local :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@inptic.ga` | `123admin` | admin |
| `teacher@inptic.ga` | `teacher123` | teacher |
| `secretariat@inptic.ga` | `secret123` | secretariat |
| `student@inptic.ga` | `student123` | student |

### Fichiers clés

- `src/lib/auth.tsx` — Contexte React (`AuthProvider`, `useAuth`), gère login/logout/stockage
- `src/lib/api.ts` — Instance Axios avec intercepteurs (ajout token + redirect 401)
- `src/components/ProtectedRoute.tsx` — Vérifie auth + rôles, redirige si nécessaire

---

## Pages détaillées

### `/login`

Page de connexion avec formulaire email/mot de passe. Design split-screen (visuel à gauche, formulaire à droite). Redirige vers `/dashboard` après connexion.

### `/dashboard`

4 vues différentes selon le rôle de l'utilisateur :

| Rôle | Vue |
|------|-----|
| **admin** | Statistiques globales (étudiants, enseignants, moyenne promo, bulletins), activité récente, décisions jury |
| **teacher** | Mes matières, nombre d'étudiants, notes restant à saisir |
| **secretariat** | Stats administratives (étudiants, notes, absences, bulletins) |
| **student** | Ma moyenne, crédits acquis, absences, mention actuelle |

### `/students`

Table CRUD des étudiants avec :
- Recherche par nom/matricule/email
- Ajout via dialogue modal
- Modification (icône crayon)
- Suppression (icône poubelle)
- Badge de statut (actif / redouble / diplômé)

### `/grades`

Saisie des notes par matière :
- Sélecteur de matière (avec coefficient affiché)
- Tableau : étudiant → CC /20, Examen /20, Rattrapage /20, Moyenne
- Calcul automatique de la moyenne : **CC × 0.4 + Examen × 0.6** (le rattrapage remplace si présent)
- Validation 0–20 sur chaque champ

### `/absences`

Suivi des absences :
- Tableau : étudiant, matière, date, heures, pénalité (0,01 pt/heure), justifiée (oui/non)
- Ajout et suppression

### `/bulletins`

Cartes des bulletins disponibles (S5, S6, annuel) :
- Moyenne et crédits affichés
- Badge validé / non validé
- Boutons "Voir" et "PDF" pour téléchargement

### `/imports`

Importation des données depuis Excel :
- **Import des notes** : Matricule | Matière | CC | Examen | Rattrapage
- **Import des étudiants** : Matricule | Nom | Prénom | Date naissance | etc.
- Interface dédiée séparée des exports pour plus de cohérence

### `/exports`

Export Excel des données :
- Décisions du jury (diplômés, redoublants, etc.)
- Relevés semestriels (S5, S6) avec filtres par groupe
- Téléchargement direct des fichiers Excel

---

## Composants réutilisables

### `StatCard` (ui-kit)

Carte de statistique avec icône, valeur, label et tendance optionnelle.

```tsx
<StatCard label="Étudiants" value="24" icon={<Users />} trend="+2 ce mois" />
```

### `PageHeader` (ui-kit)

En-tête de page avec titre, description et zone d'actions.

```tsx
<PageHeader title="Étudiants" description="24 inscrits" actions={<Button>Ajouter</Button>} />
```

### `ProtectedRoute`

Encapsule les pages protégées. Vérifie l'authentification et les rôles.

```tsx
<ProtectedRoute roles={["admin", "secretariat"]}>
  <MaPage />
</ProtectedRoute>
```

---

## Appels API vers le backend

Le client Axios (`src/lib/api.ts`) est préconfiguré :

```ts
import { api } from "@/lib/api";

// GET
const res = await api.get("/students");

// POST
await api.post("/grades", { studentId: 1, subjectId: 2, type: "CC", value: 14 });

// Téléchargement fichier (PDF/Excel)
const res = await api.get("/bulletins/student/1/semester/code/S5", { responseType: "blob" });
```

### Endpoints backend disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth/login` | POST | Connexion |
| `/auth/register` | POST | Créer un utilisateur (admin) |
| `/students` | GET | Liste des étudiants |
| `/students/:id` | GET/PUT/DELETE | CRUD étudiant |
| `/grades/student/:studentId` | GET | Notes d'un étudiant |
| `/grades/student/:studentId/subject/:subjectId` | GET | Notes par matière |
| `/grades` | POST | Ajouter/modifier une note |
| `/grades/:id` | DELETE | Supprimer une note |
| `/absences/student/:studentId` | GET | Absences d'un étudiant |
| `/absences` | POST | Ajouter une absence |
| `/absences/:id` | DELETE | Supprimer une absence |
| `/bulletins/semesters` | GET | Liste des semestres |
| `/bulletins/student/:id/semester/:semesterId` | GET | Bulletin PDF (par ID) |
| `/bulletins/student/:id/semester/code/:code` | GET | Bulletin PDF (par code S5/S6) |
| `/bulletins/student/:id/annual/:year` | GET | Bulletin annuel PDF |
| `/bulletins/student/:id/latest` | GET | Dernier bulletin PDF |
| `/import-export/grades` | POST | Import notes depuis Excel |
| `/import-export/jury` | GET | Export décisions jury (Excel) |
| `/import-export/semester/:semesterId` | GET | Relevé semestriel (Excel) |

---

## Scripts disponibles

```bash
npm run dev        # Serveur de développement (Vite)
npm run build      # Build de production
npm run build:dev  # Build en mode développement
npm run preview    # Prévisualiser le build
npm run lint       # Linting ESLint
npm run format     # Formatage Prettier
```

---

## État actuel du projet

Le frontend est **connecté au backend** via l'API REST :

- ✅ Interface complète pour toutes les fonctionnalités
- ✅ Logique de calcul des moyennes alignée avec le backend
- ✅ Système d'authentification connecté au backend (avec fallback démo)
- ✅ Navigation et permissions par rôle
- ✅ **Students** — CRUD complet via API (`GET/POST/PUT/DELETE /api/students`)
- ✅ **Grades** — Lecture/écriture/suppression via API (`GET/POST/DELETE /api/grades`)
- ✅ **Absences** — Lecture/ajout/suppression via API (`GET/POST/DELETE /api/absences`)
- ✅ **Bulletins** — Liste des semestres + téléchargement PDF réel (`GET /api/bulletins/...`)
- ✅ **Imports** — Import Excel séparé dans une page dédiée (`/imports`)
- ✅ **Exports** — Téléchargement Excel réel (`GET /api/import-export/...`)
- ✅ Modèle Student aligné avec le backend (`birthDate`, `birthPlace`, `bacType`, `originSchool`)
- ✅ Modèle Absence aligné avec le backend (`studentId`, `subjectId`, `hours`)
- ✅ **Dashboard** — Statistiques en temps réel via API (`GET /api/stats/dashboard`)
- ✅ **Programmes** — CRUD complet pour Semestres, UE et Matières

**Le projet est maintenant entièrement fonctionnel** — toutes les pages sont connectées au backend et l'admin peut gérer complètement la structure pédagogique (semestres, UE, matières) ainsi que toutes les données étudiants.

Voir `DOCUMENTATION.md` pour l'analyse détaillée de conformité frontend ↔ backend.
