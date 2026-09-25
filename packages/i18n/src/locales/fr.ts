import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'fr', {
  itemsPerPage: 'Éléments par page',
  pageOf: 'Page {page} sur {total}',
  range: '{start}–{end} sur {total} éléments',
  previous: 'Page précédente',
  next: 'Page suivante',
  nav: 'Pagination',
})
defineCatalog(builtin.toast, 'fr', {
  dismiss: 'Fermer la notification',
  region: 'Notifications',
})
defineCatalog(builtin.modal, 'fr', {
  close: 'Fermer la boîte de dialogue',
})
defineCatalog(builtin.alert, 'fr', {
  dismiss: 'Fermer',
})
defineCatalog(builtin.header, 'fr', {
  nav: 'Navigation principale',
})
defineCatalog(builtin.search, 'fr', {
  label: 'Recherche',
  placeholder: 'Rechercher',
  clear: 'Effacer la recherche',
})
defineCatalog(builtin.commandMenu, 'fr', {
  label: 'Menu des commandes',
  placeholder: 'Saisissez une commande ou recherchez…',
  empty: 'Aucun résultat',
  back: 'Retour',
  loading: 'Chargement…',
  matches: '{count} résultats',
  scopeLabel: 'Portée',
  clearScope: 'Effacer la portée',
})
defineCatalog(builtin.breadcrumb, 'fr', {
  nav: 'Fil d’Ariane',
})
defineCatalog(builtin.toc, 'fr', {
  nav: 'Sur cette page',
})
defineCatalog(builtin.datePicker, 'fr', {
  placeholder: 'Sélectionner une date',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  clear: 'Effacer la date',
  open: 'Ouvrir le calendrier',
})
defineCatalog(builtin.combobox, 'fr', {
  placeholder: 'Sélectionner une option',
  empty: 'Aucune option trouvée',
  clear: 'Effacer la sélection',
  loading: 'Chargement des options…',
  create: 'Ajouter « {label} »',
  resultCount: '{count} options disponibles',
})
defineCatalog(builtin.dataTable, 'fr', {
  search: 'Rechercher',
  empty: 'Aucune donnée',
  selectAll: 'Sélectionner toutes les lignes',
  selectRow: 'Sélectionner la ligne',
  itemsSelected: '{count} sélectionné(s)',
  expandRow: 'Développer la ligne',
  previousPage: 'Page précédente',
  nextPage: 'Page suivante',
  columns: 'Colonnes',
  actions: 'Actions',
  noResults: 'Aucune ligne correspondante',
  clearFilters: 'Effacer les filtres',
  filterColumn: 'Filtrer {column}',
  min: 'Min',
  max: 'Max',
  all: 'Tout',
  columnMenu: 'Options pour {column}',
  sortAscending: 'Tri croissant',
  sortDescending: 'Tri décroissant',
  clearSort: 'Effacer le tri',
  moveLeft: 'Déplacer vers la gauche',
  moveRight: 'Déplacer vers la droite',
  pinStart: 'Épingler au début',
  pinEnd: 'Épingler à la fin',
  unpin: 'Désépingler',
  hideColumn: 'Masquer la colonne',
  resizeColumn: 'Redimensionner {column}',
  editCell: 'Modifier {column}',
  totals: 'Total',
  exportCsv: 'Exporter en CSV',
})
defineCatalog(builtin.dock, 'fr', {
  nav: 'Navigation principale',
})
defineCatalog(builtin.steps, 'fr', {
  label: 'Étapes',
})
defineCatalog(builtin.overflowMenu, 'fr', {
  trigger: 'Plus d’actions',
})
defineCatalog(builtin.sideNav, 'fr', {
  nav: 'Navigation latérale',
  collapse: 'Réduire la navigation',
  expand: 'Développer la navigation',
})
defineCatalog(builtin.spinner, 'fr', {
  label: 'Chargement',
})
defineCatalog(builtin.numberInput, 'fr', {
  increment: 'Augmenter',
  decrement: 'Diminuer',
})
defineCatalog(builtin.tag, 'fr', {
  dismiss: 'Supprimer',
})
defineCatalog(builtin.appShell, 'fr', {
  collapse: 'Réduire la navigation',
  expand: 'Développer la navigation',
  dismissError: 'Fermer l’erreur',
})
defineCatalog(builtin.charts, 'fr', {
  legendToggle: 'Afficher/masquer la série {name}',
  noData: 'Aucune donnée',
  resetZoom: 'Réinitialiser le zoom',
  exportPng: 'Exporter en PNG',
  exportSvg: 'Exporter en SVG',
  dataView: 'Vue des données',
  restore: 'Restaurer',
})
defineCatalog(builtin.alertDialog, 'fr', {
  confirm: 'Confirmer',
  cancel: 'Annuler',
})
defineCatalog(builtin.sheet, 'fr', {
  close: 'Fermer le panneau',
})
defineCatalog(builtin.bottomSheet, 'fr', {
  close: 'Fermer',
  handle: 'Faire glisser pour redimensionner',
})
defineCatalog(builtin.actionSheet, 'fr', {
  label: 'Actions',
  cancel: 'Annuler',
})
defineCatalog(builtin.reorderList, 'fr', {
  handle: 'Réorganiser {name}',
  grabbed: '{name} saisi. Position {position} sur {total}.',
  moved: '{name} déplacé en position {position} sur {total}.',
  dropped: '{name} déposé en position {position} sur {total}.',
  cancelled: 'Réorganisation annulée. {name} a retrouvé sa position d’origine.',
})
defineCatalog(builtin.infiniteScroll, 'fr', {
  loadMore: 'Charger plus',
  loading: 'Chargement de la suite',
})
defineCatalog(builtin.pullToRefresh, 'fr', {
  pull: 'Tirer pour actualiser',
  release: 'Relâcher pour actualiser',
  refreshing: 'Actualisation',
})
defineCatalog(builtin.fileUploader, 'fr', {
  label: 'Importer des fichiers',
  drop: 'Glissez-déposez des fichiers ici ou cliquez pour importer',
  remove: 'Supprimer {name}',
  uploading: 'Importation en cours',
  complete: 'Importation terminée',
  error: 'Échec de l’importation',
  status: {
    one: '{count} fichier : {state}',
    many: '{count} fichiers : {state}',
    other: '{count} fichiers : {state}',
  },
})
defineCatalog(builtin.passwordInput, 'fr', {
  reveal: 'Afficher le mot de passe',
  hide: 'Masquer le mot de passe',
  strengthWeak: 'faible',
  strengthFair: 'moyen',
  strengthGood: 'bon',
  strengthStrong: 'fort',
  strengthLabel: 'Robustesse du mot de passe : {level}',
})
defineCatalog(builtin.multiSelect, 'fr', {
  label: 'Options',
  placeholder: 'Sélectionner des options',
  selected: '{count} sélectionné(s)',
  search: 'Rechercher des options',
  noResults: 'Aucune option trouvée',
  loading: 'Chargement des options…',
  clear: 'Effacer la sélection',
  remove: 'Supprimer {label}',
  selectAll: 'Tout sélectionner',
  clearAll: 'Tout effacer',
  create: 'Ajouter « {label} »',
  selectionChanged: '{count} sur {total} sélectionné(s)',
  maxReached: '{max} sélections au maximum',
})
defineCatalog(builtin.tagsInput, 'fr', {
  label: 'Étiquettes',
  remove: 'Supprimer {tag}',
  placeholder: 'Ajouter une étiquette…',
})
defineCatalog(builtin.otpInput, 'fr', {
  label: 'Code à usage unique',
  digit: 'Chiffre {n}',
})
defineCatalog(builtin.ai, 'fr', {
  generating: 'Génération…',
  done: 'Terminé',
  error: 'Erreur',
  send: 'Envoyer',
  placeholder: 'Saisissez un message…',
  you: 'Vous',
  assistant: 'Assistant',
})
defineCatalog(builtin.shellHeader, 'fr', {
  skipToContent: 'Aller au contenu principal',
  nav: 'Navigation principale',
  openMenu: 'Ouvrir la navigation',
  closeMenu: 'Fermer la navigation',
})
defineCatalog(builtin.headerPanel, 'fr', {
  close: 'Fermer le panneau',
})
defineCatalog(builtin.switcher, 'fr', {
  label: 'Changer d’application',
})
defineCatalog(builtin.copyButton, 'fr', {
  copy: 'Copier',
  copied: 'Copié',
})
defineCatalog(builtin.skipNav, 'fr', {
  label: 'Aller au contenu',
})
defineCatalog(builtin.form, 'fr', {
  required: 'Obligatoire',
  invalid: 'Valeur non valide',
})
defineCatalog(builtin.label, 'fr', {
  required: 'Obligatoire',
})
defineCatalog(builtin.inlineLoading, 'fr', {
  active: 'Chargement',
  finished: 'Chargé',
  error: 'Erreur',
})
defineCatalog(builtin.notification, 'fr', {
  dismiss: 'Fermer',
})
defineCatalog(builtin.treeView, 'fr', {
  loading: 'Chargement…',
  expand: 'Développer',
  collapse: 'Réduire',
})
defineCatalog(builtin.carousel, 'fr', {
  region: 'Carrousel',
  previous: 'Diapositive précédente',
  next: 'Diapositive suivante',
  slide: '{n} sur {total}',
  goTo: 'Aller à la diapositive {n}',
  choose: 'Choisir la diapositive à afficher',
  play: 'Démarrer le défilement automatique',
  pause: 'Arrêter le défilement automatique',
})
defineCatalog(builtin.calendar, 'fr', {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  today: 'Aujourd’hui',
  weekNumber: 'Semaine',
})
defineCatalog(builtin.colorPicker, 'fr', {
  hue: 'Teinte',
  alpha: 'Alpha',
  colorArea: 'Saturation et luminosité',
  saturation: 'Saturation',
  brightness: 'Luminosité',
  eyedropper: 'Prélever une couleur à l’écran',
  presets: 'Couleurs prédéfinies',
  hex: 'Valeur de couleur',
  value: 'Couleur sélectionnée {color}',
})
defineCatalog(builtin.drawer, 'fr', {
  close: 'Fermer',
})
defineCatalog(builtin.menuButton, 'fr', {
  open: 'Ouvrir le menu',
})
defineCatalog(builtin.resizable, 'fr', {
  handle: 'Redimensionner les panneaux',
})
defineCatalog(builtin.codeSnippet, 'fr', {
  copy: 'Copier le code',
  copied: 'Copié',
})
defineCatalog(builtin.dateRangePicker, 'fr', {
  label: 'Plage de dates',
  placeholder: 'Sélectionner une plage de dates',
  start: 'Date de début',
  end: 'Date de fin',
  apply: 'Appliquer',
  clear: 'Effacer',
})
defineCatalog(builtin.toggletip, 'fr', {
  label: 'Plus d’informations',
})
defineCatalog(builtin.avatarGroup, 'fr', {
  more: '{count} de plus',
})
defineCatalog(builtin.comparison, 'fr', {
  label: 'Curseur de comparaison',
})
defineCatalog(builtin.qrCode, 'fr', {
  label: 'Code QR',
})
defineCatalog(builtin.flow, 'fr', {
  zoomIn: 'Zoom avant',
  zoomOut: 'Zoom arrière',
  fitView: 'Ajuster à la vue',
  minimap: 'Mini-carte',
  play: 'Lire',
  pause: 'Pause',
  next: 'Étape suivante',
  previous: 'Étape précédente',
  restart: 'Recommencer',
  step: 'Étape {current} sur {total}',
})
defineCatalog(builtin.logViewer, 'fr', {
  label: 'Sortie du journal',
  search: 'Rechercher dans le journal',
  follow: 'Suivi en direct',
  paused: 'Aller au plus récent',
  copy: 'Copier',
  copied: 'Copié',
  empty: 'Aucune sortie de journal',
  matches: '{count} résultats',
  lines: '{count} lignes',
})
defineCatalog(builtin.editor, 'fr', {
  label: 'Éditeur de code',
  code: 'Code',
  find: 'Rechercher',
  replace: 'Remplacer',
  findPlaceholder: 'Rechercher',
  replacePlaceholder: 'Remplacer par',
  next: 'Résultat suivant',
  previous: 'Résultat précédent',
  replaceOne: 'Remplacer',
  replaceAll: 'Tout remplacer',
  close: 'Fermer',
  matchCase: 'Respecter la casse',
  toggleReplace: 'Afficher/masquer le remplacement',
  noMatches: 'Aucun résultat',
  findCount: '{current} sur {total}',
  commandMenu: 'Menu des commandes',
  commandMenuEmpty: 'Aucune commande',
})
