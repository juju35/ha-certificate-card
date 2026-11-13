/*
 * Certificate Card for Home Assistant
 * https://github.com/juju35/ha-certificate-card
 *
 * Lovelace cards for the Certificate Expiry integration (core, cert_expiry): every monitored SSL/TLS certificate with
 * its expiry date and the days left, coloured against configurable thresholds and sorted by expiry. Optional basic DNS
 * checks from existing entities: DNS IP sensors (core, dnsip: is the host name resolved?) and connectivity binary
 * sensors such as Ping (is the host reachable?).
 * Certificate Expiry and DNS IP entities are found through the entity registry (platform), so they work whatever the
 * Home Assistant language or entity ids.
 */

const VERSION = "__VERSION__";

const ICONS = {
  // mdi:certificate
  certificate:
    "M4,3C2.89,3 2,3.89 2,5V15A2,2 0 0,0 4,17H12V22L15,19L18,22V17H20A2,2 0 0,0 22,15V8L22,6V5A2,2 0 0,0 20,3H16V3H4M12,5L15,7L18,5V8.5L21,10L18,11.5V15L15,13L12,15V11.5L9,10L12,8.5V5M4,5H9V7H4V5M4,9H7V11H4V9M4,13H9V15H4V13Z",
  // mdi:lock
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  // mdi:lock-alert
  lockAlert:
    "M10,17A2,2 0 0,1 8,15C8,13.89 8.89,13 10,13A2,2 0 0,1 12,15A2,2 0 0,1 10,17M16,22V10A2,2 0 0,0 14,8H13V6C13,3.24 10.76,1 8,1C5.24,1 3,3.24 3,6V8H2A2,2 0 0,0 0,10V20A2,2 0 0,0 2,22H16M5,6A3,3 0 0,1 8,3A3,3 0 0,1 11,6V8H5V6M20,15H22V17H20V15M20,7H22V13H20V7Z",
  // mdi:timer-sand
  sand: "M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",
  // mdi:dns
  dns: "M7,9A2,2 0 0,1 5,7A2,2 0 0,1 7,5A2,2 0 0,1 9,7A2,2 0 0,1 7,9M20,3H4A1,1 0 0,0 3,4V10A1,1 0 0,0 4,11H20A1,1 0 0,0 21,10V4A1,1 0 0,0 20,3M7,19A2,2 0 0,1 5,17A2,2 0 0,1 7,15A2,2 0 0,1 9,17A2,2 0 0,1 7,19M20,13H4A1,1 0 0,0 3,14V20A1,1 0 0,0 4,21H20A1,1 0 0,0 21,20V14A1,1 0 0,0 20,13Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's detail button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

// Days and hours are formatted by Intl (NumberFormat units, RelativeTimeFormat): no counted noun to translate here.
const STRINGS = {
  en: {
    certificates: "Certificates",
    dns: "DNS checks",
    valid: "Valid",
    expiring: "Expiring soon",
    expired: "Expired",
    invalid: "Invalid",
    all_valid: "All valid",
    dns_issue: "DNS issue",
    state_unavailable: "Unavailable",
    state_unknown: "Unknown",
    next_expiry: "Next expiry {when}",
    expires_on: "Expires on {date}",
    expired_on: "Expired on {date}",
    resolved: "Resolved",
    not_resolved: "Not resolved",
    reachable: "Reachable",
    unreachable: "Unreachable",
    all_ok: "Nothing to report",
    more: "+{n} more",
    no_certs: "No certificate found. Is the Certificate Expiry integration installed?",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    title: "Title (optional)",
    entities: "Certificates (empty: every Certificate Expiry sensor)",
    exclude: "Hidden certificates",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    show_counts: "Show counters (valid, expiring, expired)",
    show_date: "Show the expiry date",
    only_problems: "Only list certificates expiring soon or expired",
    warning_days: "Orange under (days)",
    critical_days: "Red under (days)",
    max_items: "Certificates listed",
    show_dns: "Show DNS checks",
    dns_entities: "DNS checks (empty: every DNS IP sensor)",
    expand_dns: "DNS checks expanded by default",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card and back",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    certificates: "Certificats",
    dns: "Contrôles DNS",
    valid: "Valides",
    expiring: "Expire bientôt",
    expired: "Expiré",
    invalid: "Invalide",
    all_valid: "Tous valides",
    dns_issue: "Problème DNS",
    state_unavailable: "Indisponible",
    state_unknown: "Inconnu",
    next_expiry: "Prochaine expiration {when}",
    expires_on: "Expire le {date}",
    expired_on: "Expiré le {date}",
    resolved: "Résolu",
    not_resolved: "Non résolu",
    reachable: "Joignable",
    unreachable: "Injoignable",
    all_ok: "Rien à signaler",
    more: "+{n} autres",
    no_certs: "Aucun certificat trouvé. L’intégration Certificate Expiry est-elle installée ?",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    title: "Titre (facultatif)",
    entities: "Certificats (vide : tous les capteurs Certificate Expiry)",
    exclude: "Certificats masqués",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    show_counts: "Afficher les compteurs (valides, bientôt expirés, expirés)",
    show_date: "Afficher la date d’expiration",
    only_problems: "Lister uniquement les certificats bientôt expirés ou expirés",
    warning_days: "Orange sous (jours)",
    critical_days: "Rouge sous (jours)",
    max_items: "Certificats listés",
    show_dns: "Afficher les contrôles DNS",
    dns_entities: "Contrôles DNS (vide : tous les capteurs DNS IP)",
    expand_dns: "Contrôles DNS dépliés par défaut",
    zoom: "Bouton de détail",
    zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    certificates: "Zertifikate",
    dns: "DNS-Prüfungen",
    valid: "Gültig",
    expiring: "Läuft bald ab",
    expired: "Abgelaufen",
    invalid: "Ungültig",
    all_valid: "Alle gültig",
    dns_issue: "DNS-Problem",
    state_unavailable: "Nicht verfügbar",
    state_unknown: "Unbekannt",
    next_expiry: "Nächster Ablauf {when}",
    expires_on: "Läuft ab am {date}",
    expired_on: "Abgelaufen am {date}",
    resolved: "Aufgelöst",
    not_resolved: "Nicht aufgelöst",
    reachable: "Erreichbar",
    unreachable: "Nicht erreichbar",
    all_ok: "Nichts zu melden",
    more: "+{n} weitere",
    no_certs: "Kein Zertifikat gefunden. Ist die Integration Certificate Expiry installiert?",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    title: "Titel (optional)",
    entities: "Zertifikate (leer: alle Certificate-Expiry-Sensoren)",
    exclude: "Ausgeblendete Zertifikate",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    show_counts: "Zähler anzeigen (gültig, läuft ab, abgelaufen)",
    show_date: "Ablaufdatum anzeigen",
    only_problems: "Nur bald ablaufende oder abgelaufene Zertifikate auflisten",
    warning_days: "Orange unter (Tage)",
    critical_days: "Rot unter (Tage)",
    max_items: "Aufgelistete Zertifikate",
    show_dns: "DNS-Prüfungen anzeigen",
    dns_entities: "DNS-Prüfungen (leer: alle DNS-IP-Sensoren)",
    expand_dns: "DNS-Prüfungen standardmäßig ausgeklappt",
    zoom: "Detailschaltfläche",
    zoom_helper: "Schaltet die Mini-Karte zur vollständigen Karte um und zurück",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    certificates: "Certificados",
    dns: "Comprobaciones DNS",
    valid: "Válidos",
    expiring: "Caduca pronto",
    expired: "Caducado",
    invalid: "No válido",
    all_valid: "Todos válidos",
    dns_issue: "Problema de DNS",
    state_unavailable: "No disponible",
    state_unknown: "Desconocido",
    next_expiry: "Próxima caducidad {when}",
    expires_on: "Caduca el {date}",
    expired_on: "Caducó el {date}",
    resolved: "Resuelto",
    not_resolved: "No resuelto",
    reachable: "Accesible",
    unreachable: "Inaccesible",
    all_ok: "Nada que señalar",
    more: "+{n} más",
    no_certs: "No se ha encontrado ningún certificado. ¿Está instalada la integración Certificate Expiry?",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    title: "Título (opcional)",
    entities: "Certificados (vacío: todos los sensores Certificate Expiry)",
    exclude: "Certificados ocultos",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    show_counts: "Mostrar los contadores (válidos, caducan pronto, caducados)",
    show_date: "Mostrar la fecha de caducidad",
    only_problems: "Listar solo los certificados que caducan pronto o caducados",
    warning_days: "Naranja por debajo de (días)",
    critical_days: "Rojo por debajo de (días)",
    max_items: "Certificados listados",
    show_dns: "Mostrar las comprobaciones DNS",
    dns_entities: "Comprobaciones DNS (vacío: todos los sensores DNS IP)",
    expand_dns: "Comprobaciones DNS desplegadas por defecto",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    certificates: "Сертификати",
    dns: "DNS провере",
    valid: "Важећи",
    expiring: "Ускоро истиче",
    expired: "Истекао",
    invalid: "Неважећи",
    all_valid: "Сви важећи",
    dns_issue: "DNS проблем",
    state_unavailable: "Недоступно",
    state_unknown: "Непознато",
    next_expiry: "Следеће истицање {when}",
    expires_on: "Истиче {date}",
    expired_on: "Истекао {date}",
    resolved: "Разрешено",
    not_resolved: "Није разрешено",
    reachable: "Доступан",
    unreachable: "Недоступан",
    all_ok: "Нема ништа за пријаву",
    more: "+{n} још",
    no_certs: "Није пронађен ниједан сертификат. Да ли је интеграција Certificate Expiry инсталирана?",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    title: "Наслов (опционо)",
    entities: "Сертификати (празно: сви Certificate Expiry сензори)",
    exclude: "Скривени сертификати",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    show_counts: "Прикажи бројаче (важећи, ускоро истичу, истекли)",
    show_date: "Прикажи датум истицања",
    only_problems: "Прикажи само сертификате који ускоро истичу или су истекли",
    warning_days: "Наранџасто испод (дана)",
    critical_days: "Црвено испод (дана)",
    max_items: "Приказани сертификати",
    show_dns: "Прикажи DNS провере",
    dns_entities: "DNS провере (празно: сви DNS IP сензори)",
    expand_dns: "DNS провере подразумевано отворене",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на целу картицу и назад",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    certificates: "Sertifikati",
    dns: "DNS provere",
    valid: "Važeći",
    expiring: "Uskoro ističe",
    expired: "Istekao",
    invalid: "Nevažeći",
    all_valid: "Svi važeći",
    dns_issue: "DNS problem",
    state_unavailable: "Nedostupno",
    state_unknown: "Nepoznato",
    next_expiry: "Sledeće isticanje {when}",
    expires_on: "Ističe {date}",
    expired_on: "Istekao {date}",
    resolved: "Razrešeno",
    not_resolved: "Nije razrešeno",
    reachable: "Dostupan",
    unreachable: "Nedostupan",
    all_ok: "Nema ništa za prijavu",
    more: "+{n} još",
    no_certs: "Nije pronađen nijedan sertifikat. Da li je integracija Certificate Expiry instalirana?",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    title: "Naslov (opciono)",
    entities: "Sertifikati (prazno: svi Certificate Expiry senzori)",
    exclude: "Skriveni sertifikati",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_counts: "Prikaži brojače (važeći, uskoro ističu, istekli)",
    show_date: "Prikaži datum isticanja",
    only_problems: "Prikaži samo sertifikate koji uskoro ističu ili su istekli",
    warning_days: "Narandžasto ispod (dana)",
    critical_days: "Crveno ispod (dana)",
    max_items: "Prikazani sertifikati",
    show_dns: "Prikaži DNS provere",
    dns_entities: "DNS provere (prazno: svi DNS IP senzori)",
    expand_dns: "DNS provere podrazumevano otvorene",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na celu karticu i nazad",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    certificates: "Certificati",
    dns: "Controlli DNS",
    valid: "Validi",
    expiring: "In scadenza",
    expired: "Scaduto",
    invalid: "Non valido",
    all_valid: "Tutti validi",
    dns_issue: "Problema DNS",
    state_unavailable: "Non disponibile",
    state_unknown: "Sconosciuto",
    next_expiry: "Prossima scadenza {when}",
    expires_on: "Scade il {date}",
    expired_on: "Scaduto il {date}",
    resolved: "Risolto",
    not_resolved: "Non risolto",
    reachable: "Raggiungibile",
    unreachable: "Non raggiungibile",
    all_ok: "Niente da segnalare",
    more: "+{n} altri",
    no_certs: "Nessun certificato trovato. L’integrazione Certificate Expiry è installata?",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    title: "Titolo (facoltativo)",
    entities: "Certificati (vuoto: tutti i sensori Certificate Expiry)",
    exclude: "Certificati nascosti",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    show_counts: "Mostra i contatori (validi, in scadenza, scaduti)",
    show_date: "Mostra la data di scadenza",
    only_problems: "Elenca solo i certificati in scadenza o scaduti",
    warning_days: "Arancione sotto (giorni)",
    critical_days: "Rosso sotto (giorni)",
    max_items: "Certificati elencati",
    show_dns: "Mostra i controlli DNS",
    dns_entities: "Controlli DNS (vuoto: tutti i sensori DNS IP)",
    expand_dns: "Controlli DNS espansi per impostazione predefinita",
    zoom: "Pulsante dettagli",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    certificates: "Certificaten",
    dns: "DNS-controles",
    valid: "Geldig",
    expiring: "Verloopt binnenkort",
    expired: "Verlopen",
    invalid: "Ongeldig",
    all_valid: "Alle geldig",
    dns_issue: "DNS-probleem",
    state_unavailable: "Niet beschikbaar",
    state_unknown: "Onbekend",
    next_expiry: "Volgende vervaldatum {when}",
    expires_on: "Verloopt op {date}",
    expired_on: "Verlopen op {date}",
    resolved: "Opgelost",
    not_resolved: "Niet opgelost",
    reachable: "Bereikbaar",
    unreachable: "Onbereikbaar",
    all_ok: "Niets te melden",
    more: "+{n} meer",
    no_certs: "Geen certificaat gevonden. Is de integratie Certificate Expiry geïnstalleerd?",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    title: "Titel (optioneel)",
    entities: "Certificaten (leeg: alle Certificate Expiry-sensoren)",
    exclude: "Verborgen certificaten",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    show_counts: "Tellers tonen (geldig, verloopt binnenkort, verlopen)",
    show_date: "Vervaldatum tonen",
    only_problems: "Alleen certificaten tonen die binnenkort verlopen of verlopen zijn",
    warning_days: "Oranje onder (dagen)",
    critical_days: "Rood onder (dagen)",
    max_items: "Getoonde certificaten",
    show_dns: "DNS-controles tonen",
    dns_entities: "DNS-controles (leeg: alle DNS IP-sensoren)",
    expand_dns: "DNS-controles standaard uitgeklapt",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    certificates: "Certificados",
    dns: "Verificações DNS",
    valid: "Válidos",
    expiring: "Expira em breve",
    expired: "Expirado",
    invalid: "Inválido",
    all_valid: "Todos válidos",
    dns_issue: "Problema de DNS",
    state_unavailable: "Indisponível",
    state_unknown: "Desconhecido",
    next_expiry: "Próxima expiração {when}",
    expires_on: "Expira a {date}",
    expired_on: "Expirou a {date}",
    resolved: "Resolvido",
    not_resolved: "Não resolvido",
    reachable: "Acessível",
    unreachable: "Inacessível",
    all_ok: "Nada a assinalar",
    more: "+{n} mais",
    no_certs: "Nenhum certificado encontrado. A integração Certificate Expiry está instalada?",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    title: "Título (opcional)",
    entities: "Certificados (vazio: todos os sensores Certificate Expiry)",
    exclude: "Certificados ocultos",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    show_counts: "Mostrar os contadores (válidos, a expirar, expirados)",
    show_date: "Mostrar a data de expiração",
    only_problems: "Listar apenas os certificados a expirar ou expirados",
    warning_days: "Laranja abaixo de (dias)",
    critical_days: "Vermelho abaixo de (dias)",
    max_items: "Certificados listados",
    show_dns: "Mostrar as verificações DNS",
    dns_entities: "Verificações DNS (vazio: todos os sensores DNS IP)",
    expand_dns: "Verificações DNS expandidas por predefinição",
    zoom: "Botão de detalhe",
    zoom_helper: "Alterna o mini cartão para o cartão completo e vice-versa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    certificates: "Certyfikaty",
    dns: "Kontrole DNS",
    valid: "Ważne",
    expiring: "Wkrótce wygasa",
    expired: "Wygasł",
    invalid: "Nieważny",
    all_valid: "Wszystkie ważne",
    dns_issue: "Problem z DNS",
    state_unavailable: "Niedostępny",
    state_unknown: "Nieznany",
    next_expiry: "Najbliższe wygaśnięcie {when}",
    expires_on: "Wygasa {date}",
    expired_on: "Wygasł {date}",
    resolved: "Rozwiązano",
    not_resolved: "Nie rozwiązano",
    reachable: "Osiągalny",
    unreachable: "Nieosiągalny",
    all_ok: "Nic do zgłoszenia",
    more: "+{n} więcej",
    no_certs: "Nie znaleziono żadnego certyfikatu. Czy integracja Certificate Expiry jest zainstalowana?",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    title: "Tytuł (opcjonalnie)",
    entities: "Certyfikaty (puste: wszystkie czujniki Certificate Expiry)",
    exclude: "Ukryte certyfikaty",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    show_counts: "Pokaż liczniki (ważne, wkrótce wygasają, wygasłe)",
    show_date: "Pokaż datę wygaśnięcia",
    only_problems: "Pokaż tylko certyfikaty wkrótce wygasające lub wygasłe",
    warning_days: "Pomarańczowy poniżej (dni)",
    critical_days: "Czerwony poniżej (dni)",
    max_items: "Wyświetlane certyfikaty",
    show_dns: "Pokaż kontrole DNS",
    dns_entities: "Kontrole DNS (puste: wszystkie czujniki DNS IP)",
    expand_dns: "Kontrole DNS domyślnie rozwinięte",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
    language: "Język",
    lang_auto: "Automatycznie",
  },
  ro: {
    certificates: "Certificate",
    dns: "Verificări DNS",
    valid: "Valide",
    expiring: "Expiră curând",
    expired: "Expirat",
    invalid: "Nevalid",
    all_valid: "Toate valide",
    dns_issue: "Problemă DNS",
    state_unavailable: "Indisponibil",
    state_unknown: "Necunoscut",
    next_expiry: "Următoarea expirare {when}",
    expires_on: "Expiră pe {date}",
    expired_on: "A expirat pe {date}",
    resolved: "Rezolvat",
    not_resolved: "Nerezolvat",
    reachable: "Accesibil",
    unreachable: "Inaccesibil",
    all_ok: "Nimic de semnalat",
    more: "+încă {n}",
    no_certs: "Nu a fost găsit niciun certificat. Este instalată integrarea Certificate Expiry?",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    title: "Titlu (opțional)",
    entities: "Certificate (gol: toți senzorii Certificate Expiry)",
    exclude: "Certificate ascunse",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    show_counts: "Afișează contoarele (valide, expiră curând, expirate)",
    show_date: "Afișează data expirării",
    only_problems: "Listează doar certificatele care expiră curând sau expirate",
    warning_days: "Portocaliu sub (zile)",
    critical_days: "Roșu sub (zile)",
    max_items: "Certificate listate",
    show_dns: "Afișează verificările DNS",
    dns_entities: "Verificări DNS (gol: toți senzorii DNS IP)",
    expand_dns: "Verificări DNS extinse implicit",
    zoom: "Buton de detalii",
    zoom_helper: "Comută mini cardul la cardul complet și înapoi",
    language: "Limbă",
    lang_auto: "Automat",
  },
  da: {
    certificates: "Certifikater",
    dns: "DNS-tjek",
    valid: "Gyldige",
    expiring: "Udløber snart",
    expired: "Udløbet",
    invalid: "Ugyldigt",
    all_valid: "Alle gyldige",
    dns_issue: "DNS-problem",
    state_unavailable: "Utilgængelig",
    state_unknown: "Ukendt",
    next_expiry: "Næste udløb {when}",
    expires_on: "Udløber den {date}",
    expired_on: "Udløb den {date}",
    resolved: "Opløst",
    not_resolved: "Ikke opløst",
    reachable: "Tilgængelig",
    unreachable: "Ikke tilgængelig",
    all_ok: "Intet at rapportere",
    more: "+{n} mere",
    no_certs: "Intet certifikat fundet. Er integrationen Certificate Expiry installeret?",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    title: "Titel (valgfri)",
    entities: "Certifikater (tom: alle Certificate Expiry-sensorer)",
    exclude: "Skjulte certifikater",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    show_counts: "Vis tællere (gyldige, udløber snart, udløbet)",
    show_date: "Vis udløbsdato",
    only_problems: "Vis kun certifikater, der snart udløber eller er udløbet",
    warning_days: "Orange under (dage)",
    critical_days: "Rød under (dage)",
    max_items: "Viste certifikater",
    show_dns: "Vis DNS-tjek",
    dns_entities: "DNS-tjek (tom: alle DNS IP-sensorer)",
    expand_dns: "DNS-tjek foldet ud som standard",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til hele kortet og tilbage",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    certificates: "Certifikat",
    dns: "DNS-kontroller",
    valid: "Giltiga",
    expiring: "Löper snart ut",
    expired: "Utgånget",
    invalid: "Ogiltigt",
    all_valid: "Alla giltiga",
    dns_issue: "DNS-problem",
    state_unavailable: "Otillgänglig",
    state_unknown: "Okänd",
    next_expiry: "Nästa utgång {when}",
    expires_on: "Löper ut {date}",
    expired_on: "Gick ut {date}",
    resolved: "Uppslagen",
    not_resolved: "Inte uppslagen",
    reachable: "Nåbar",
    unreachable: "Inte nåbar",
    all_ok: "Inget att rapportera",
    more: "+{n} till",
    no_certs: "Inget certifikat hittades. Är integrationen Certificate Expiry installerad?",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    title: "Titel (valfri)",
    entities: "Certifikat (tomt: alla Certificate Expiry-sensorer)",
    exclude: "Dolda certifikat",
    show_title: "Visa titel",
    show_subtitle: "Visa undertitel",
    show_counts: "Visa räknare (giltiga, löper snart ut, utgångna)",
    show_date: "Visa utgångsdatum",
    only_problems: "Lista bara certifikat som snart löper ut eller har gått ut",
    warning_days: "Orange under (dagar)",
    critical_days: "Röd under (dagar)",
    max_items: "Listade certifikat",
    show_dns: "Visa DNS-kontroller",
    dns_entities: "DNS-kontroller (tomt: alla DNS IP-sensorer)",
    expand_dns: "DNS-kontroller utfällda som standard",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till hela kortet och tillbaka",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    certificates: "Сертификати",
    dns: "DNS проверки",
    valid: "Валидни",
    expiring: "Изтича скоро",
    expired: "Изтекъл",
    invalid: "Невалиден",
    all_valid: "Всички валидни",
    dns_issue: "DNS проблем",
    state_unavailable: "Недостъпно",
    state_unknown: "Неизвестно",
    next_expiry: "Следващо изтичане {when}",
    expires_on: "Изтича на {date}",
    expired_on: "Изтекъл на {date}",
    resolved: "Разрешено",
    not_resolved: "Неразрешено",
    reachable: "Достъпен",
    unreachable: "Недостъпен",
    all_ok: "Няма нищо за докладване",
    more: "+още {n}",
    no_certs: "Не е намерен сертификат. Инсталирана ли е интеграцията Certificate Expiry?",
    zoom_in: "Покажи цялата карта",
    zoom_out: "Обратно към компактния изглед",
    title: "Заглавие (по избор)",
    entities: "Сертификати (празно: всички сензори Certificate Expiry)",
    exclude: "Скрити сертификати",
    show_title: "Покажи заглавието",
    show_subtitle: "Покажи подзаглавието",
    show_counts: "Покажи броячите (валидни, изтичат скоро, изтекли)",
    show_date: "Покажи датата на изтичане",
    only_problems: "Показвай само сертификати, които изтичат скоро или са изтекли",
    warning_days: "Оранжево под (дни)",
    critical_days: "Червено под (дни)",
    max_items: "Показани сертификати",
    show_dns: "Покажи DNS проверките",
    dns_entities: "DNS проверки (празно: всички сензори DNS IP)",
    expand_dns: "DNS проверките са разгънати по подразбиране",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към цялата карта и обратно",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    certificates: "Сертификаты",
    dns: "Проверки DNS",
    valid: "Действительны",
    expiring: "Скоро истекает",
    expired: "Истёк",
    invalid: "Недействителен",
    all_valid: "Все действительны",
    dns_issue: "Проблема DNS",
    state_unavailable: "Недоступно",
    state_unknown: "Неизвестно",
    next_expiry: "Ближайшее истечение {when}",
    expires_on: "Истекает {date}",
    expired_on: "Истёк {date}",
    resolved: "Разрешено",
    not_resolved: "Не разрешено",
    reachable: "Доступен",
    unreachable: "Недоступен",
    all_ok: "Нечего сообщить",
    more: "+ещё {n}",
    no_certs: "Сертификаты не найдены. Установлена ли интеграция Certificate Expiry?",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    title: "Заголовок (необязательно)",
    entities: "Сертификаты (пусто: все датчики Certificate Expiry)",
    exclude: "Скрытые сертификаты",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    show_counts: "Показывать счётчики (действительны, скоро истекают, истекли)",
    show_date: "Показывать дату истечения",
    only_problems: "Показывать только скоро истекающие или истёкшие сертификаты",
    warning_days: "Оранжевый ниже (дней)",
    critical_days: "Красный ниже (дней)",
    max_items: "Показанные сертификаты",
    show_dns: "Показывать проверки DNS",
    dns_entities: "Проверки DNS (пусто: все датчики DNS IP)",
    expand_dns: "Проверки DNS развёрнуты по умолчанию",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    certificates: "Сертифікати",
    dns: "Перевірки DNS",
    valid: "Дійсні",
    expiring: "Незабаром спливає",
    expired: "Сплив",
    invalid: "Недійсний",
    all_valid: "Усі дійсні",
    dns_issue: "Проблема DNS",
    state_unavailable: "Недоступно",
    state_unknown: "Невідомо",
    next_expiry: "Найближче закінчення {when}",
    expires_on: "Спливає {date}",
    expired_on: "Сплив {date}",
    resolved: "Розв’язано",
    not_resolved: "Не розв’язано",
    reachable: "Доступний",
    unreachable: "Недоступний",
    all_ok: "Нічого повідомити",
    more: "+ще {n}",
    no_certs: "Сертифікатів не знайдено. Чи встановлено інтеграцію Certificate Expiry?",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    title: "Заголовок (необов’язково)",
    entities: "Сертифікати (порожньо: усі датчики Certificate Expiry)",
    exclude: "Приховані сертифікати",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    show_counts: "Показувати лічильники (дійсні, незабаром спливають, сплили)",
    show_date: "Показувати дату закінчення",
    only_problems: "Показувати лише сертифікати, що незабаром спливають або сплили",
    warning_days: "Помаранчевий нижче (днів)",
    critical_days: "Червоний нижче (днів)",
    max_items: "Показані сертифікати",
    show_dns: "Показувати перевірки DNS",
    dns_entities: "Перевірки DNS (порожньо: усі датчики DNS IP)",
    expand_dns: "Перевірки DNS розгорнуті за замовчуванням",
    zoom: "Кнопка подробиць",
    zoom_helper: "Перемикає міні-картку на повну картку і назад",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    certificates: "Tanúsítványok",
    dns: "DNS-ellenőrzések",
    valid: "Érvényes",
    expiring: "Hamarosan lejár",
    expired: "Lejárt",
    invalid: "Érvénytelen",
    all_valid: "Mind érvényes",
    dns_issue: "DNS-hiba",
    state_unavailable: "Nem elérhető",
    state_unknown: "Ismeretlen",
    next_expiry: "Következő lejárat {when}",
    expires_on: "Lejár: {date}",
    expired_on: "Lejárt: {date}",
    resolved: "Feloldva",
    not_resolved: "Nincs feloldva",
    reachable: "Elérhető",
    unreachable: "Nem érhető el",
    all_ok: "Nincs jelentenivaló",
    more: "+{n} további",
    no_certs: "Nem található tanúsítvány. Telepítve van a Certificate Expiry integráció?",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    title: "Cím (nem kötelező)",
    entities: "Tanúsítványok (üres: minden Certificate Expiry érzékelő)",
    exclude: "Elrejtett tanúsítványok",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    show_counts: "Számlálók megjelenítése (érvényes, hamarosan lejár, lejárt)",
    show_date: "Lejárati dátum megjelenítése",
    only_problems: "Csak a hamarosan lejáró vagy lejárt tanúsítványok listázása",
    warning_days: "Narancs ez alatt (nap)",
    critical_days: "Piros ez alatt (nap)",
    max_items: "Listázott tanúsítványok",
    show_dns: "DNS-ellenőrzések megjelenítése",
    dns_entities: "DNS-ellenőrzések (üres: minden DNS IP érzékelő)",
    expand_dns: "DNS-ellenőrzések alapértelmezetten kibontva",
    zoom: "Részletek gomb",
    zoom_helper: "A minikártyát a teljes kártyára váltja és vissza",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    certificates: "Certifikáty",
    dns: "Kontroly DNS",
    valid: "Platné",
    expiring: "Čoskoro vyprší",
    expired: "Vypršal",
    invalid: "Neplatný",
    all_valid: "Všetky platné",
    dns_issue: "Problém s DNS",
    state_unavailable: "Nedostupné",
    state_unknown: "Neznáme",
    next_expiry: "Najbližšie vypršanie {when}",
    expires_on: "Vyprší {date}",
    expired_on: "Vypršal {date}",
    resolved: "Preložené",
    not_resolved: "Nepreložené",
    reachable: "Dostupný",
    unreachable: "Nedostupný",
    all_ok: "Nič na hlásenie",
    more: "+{n} ďalšie",
    no_certs: "Nenašiel sa žiadny certifikát. Je nainštalovaná integrácia Certificate Expiry?",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    title: "Názov (voliteľné)",
    entities: "Certifikáty (prázdne: všetky senzory Certificate Expiry)",
    exclude: "Skryté certifikáty",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnadpis",
    show_counts: "Zobraziť počítadlá (platné, čoskoro vypršia, vypršané)",
    show_date: "Zobraziť dátum vypršania",
    only_problems: "Zobraziť len certifikáty, ktoré čoskoro vypršia alebo vypršali",
    warning_days: "Oranžová pod (dni)",
    critical_days: "Červená pod (dni)",
    max_items: "Zobrazené certifikáty",
    show_dns: "Zobraziť kontroly DNS",
    dns_entities: "Kontroly DNS (prázdne: všetky senzory DNS IP)",
    expand_dns: "Kontroly DNS predvolene rozbalené",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepína minikartu na celú kartu a späť",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    certificates: "Certifikáty",
    dns: "Kontroly DNS",
    valid: "Platné",
    expiring: "Brzy vyprší",
    expired: "Vypršel",
    invalid: "Neplatný",
    all_valid: "Všechny platné",
    dns_issue: "Problém s DNS",
    state_unavailable: "Nedostupné",
    state_unknown: "Neznámé",
    next_expiry: "Nejbližší vypršení {when}",
    expires_on: "Vyprší {date}",
    expired_on: "Vypršel {date}",
    resolved: "Přeloženo",
    not_resolved: "Nepřeloženo",
    reachable: "Dostupný",
    unreachable: "Nedostupný",
    all_ok: "Nic k hlášení",
    more: "+{n} další",
    no_certs: "Nebyl nalezen žádný certifikát. Je nainstalována integrace Certificate Expiry?",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    title: "Název (volitelné)",
    entities: "Certifikáty (prázdné: všechny senzory Certificate Expiry)",
    exclude: "Skryté certifikáty",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podnadpis",
    show_counts: "Zobrazit počítadla (platné, brzy vyprší, vypršelé)",
    show_date: "Zobrazit datum vypršení",
    only_problems: "Zobrazit jen certifikáty, které brzy vyprší nebo vypršely",
    warning_days: "Oranžová pod (dny)",
    critical_days: "Červená pod (dny)",
    max_items: "Zobrazené certifikáty",
    show_dns: "Zobrazit kontroly DNS",
    dns_entities: "Kontroly DNS (prázdné: všechny senzory DNS IP)",
    expand_dns: "Kontroly DNS ve výchozím stavu rozbalené",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepíná minikartu na celou kartu a zpět",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    certificates: "Potrdila",
    dns: "Preverjanja DNS",
    valid: "Veljavna",
    expiring: "Kmalu poteče",
    expired: "Poteklo",
    invalid: "Neveljavno",
    all_valid: "Vsa veljavna",
    dns_issue: "Težava z DNS",
    state_unavailable: "Ni na voljo",
    state_unknown: "Neznano",
    next_expiry: "Naslednji potek {when}",
    expires_on: "Poteče {date}",
    expired_on: "Poteklo {date}",
    resolved: "Razrešeno",
    not_resolved: "Ni razrešeno",
    reachable: "Dosegljiv",
    unreachable: "Nedosegljiv",
    all_ok: "Ni ničesar za poročati",
    more: "+še {n}",
    no_certs: "Ni najdenega potrdila. Ali je integracija Certificate Expiry nameščena?",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjeni pogled",
    title: "Naslov (neobvezno)",
    entities: "Potrdila (prazno: vsi senzorji Certificate Expiry)",
    exclude: "Skrita potrdila",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_counts: "Prikaži števce (veljavna, kmalu potečejo, potekla)",
    show_date: "Prikaži datum poteka",
    only_problems: "Prikaži samo potrdila, ki kmalu potečejo ali so potekla",
    warning_days: "Oranžno pod (dni)",
    critical_days: "Rdeče pod (dni)",
    max_items: "Prikazana potrdila",
    show_dns: "Prikaži preverjanja DNS",
    dns_entities: "Preverjanja DNS (prazno: vsi senzorji DNS IP)",
    expand_dns: "Preverjanja DNS privzeto razširjena",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na celotno kartico in nazaj",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    certificates: "Sertifikāti",
    dns: "DNS pārbaudes",
    valid: "Derīgi",
    expiring: "Drīz beigsies",
    expired: "Beidzies",
    invalid: "Nederīgs",
    all_valid: "Visi derīgi",
    dns_issue: "DNS problēma",
    state_unavailable: "Nav pieejams",
    state_unknown: "Nezināms",
    next_expiry: "Nākamā termiņa beigas {when}",
    expires_on: "Beidzas {date}",
    expired_on: "Beidzās {date}",
    resolved: "Atrisināts",
    not_resolved: "Nav atrisināts",
    reachable: "Sasniedzams",
    unreachable: "Nav sasniedzams",
    all_ok: "Nav ko ziņot",
    more: "+vēl {n}",
    no_certs: "Netika atrasts neviens sertifikāts. Vai integrācija Certificate Expiry ir instalēta?",
    zoom_in: "Rādīt pilno kartīti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    title: "Nosaukums (neobligāts)",
    entities: "Sertifikāti (tukšs: visi Certificate Expiry sensori)",
    exclude: "Paslēptie sertifikāti",
    show_title: "Rādīt nosaukumu",
    show_subtitle: "Rādīt apakšnosaukumu",
    show_counts: "Rādīt skaitītājus (derīgi, drīz beigsies, beigušies)",
    show_date: "Rādīt termiņa beigu datumu",
    only_problems: "Rādīt tikai sertifikātus, kas drīz beigsies vai ir beigušies",
    warning_days: "Oranžs zem (dienas)",
    critical_days: "Sarkans zem (dienas)",
    max_items: "Parādītie sertifikāti",
    show_dns: "Rādīt DNS pārbaudes",
    dns_entities: "DNS pārbaudes (tukšs: visi DNS IP sensori)",
    expand_dns: "DNS pārbaudes pēc noklusējuma izvērstas",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini kartīti uz pilno kartīti un atpakaļ",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    certificates: "Πιστοποιητικά",
    dns: "Έλεγχοι DNS",
    valid: "Έγκυρα",
    expiring: "Λήγει σύντομα",
    expired: "Έληξε",
    invalid: "Μη έγκυρο",
    all_valid: "Όλα έγκυρα",
    dns_issue: "Πρόβλημα DNS",
    state_unavailable: "Μη διαθέσιμο",
    state_unknown: "Άγνωστο",
    next_expiry: "Επόμενη λήξη {when}",
    expires_on: "Λήγει στις {date}",
    expired_on: "Έληξε στις {date}",
    resolved: "Επιλύθηκε",
    not_resolved: "Δεν επιλύθηκε",
    reachable: "Προσβάσιμο",
    unreachable: "Μη προσβάσιμο",
    all_ok: "Τίποτα προς αναφορά",
    more: "+{n} ακόμη",
    no_certs: "Δεν βρέθηκε πιστοποιητικό. Είναι εγκατεστημένη η ενσωμάτωση Certificate Expiry;",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    title: "Τίτλος (προαιρετικό)",
    entities: "Πιστοποιητικά (κενό: όλοι οι αισθητήρες Certificate Expiry)",
    exclude: "Κρυφά πιστοποιητικά",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    show_counts: "Εμφάνιση μετρητών (έγκυρα, λήγουν σύντομα, έληξαν)",
    show_date: "Εμφάνιση ημερομηνίας λήξης",
    only_problems: "Εμφάνιση μόνο πιστοποιητικών που λήγουν σύντομα ή έληξαν",
    warning_days: "Πορτοκαλί κάτω από (ημέρες)",
    critical_days: "Κόκκινο κάτω από (ημέρες)",
    max_items: "Εμφανιζόμενα πιστοποιητικά",
    show_dns: "Εμφάνιση ελέγχων DNS",
    dns_entities: "Έλεγχοι DNS (κενό: όλοι οι αισθητήρες DNS IP)",
    expand_dns: "Έλεγχοι DNS ανεπτυγμένοι από προεπιλογή",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Εναλλάσσει τη μίνι κάρτα στην πλήρη κάρτα και πίσω",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// Locale of the dates and numbers: Home Assistant's own language when its base matches the card's language
// (keeps the region, e.g. de-CH or fr-CA), otherwise the card's language. Home Assistant's "pt" is European
// Portuguese, which Intl would format as Brazilian, so bare "pt" becomes "pt-PT".
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

// The time the card counts from. The screenshot harness pins it (window.__CERT_CARD_NOW__) so the captures do not
// change every day.
const now = () => globalThis.__CERT_CARD_NOW__ ?? Date.now();

const DAY = 864e5;
const HOUR = 36e5;
// Days left drawn as a full bar: a Let's Encrypt certificate lives 90 days.
const BAR_DAYS = 90;
const THRESHOLDS = { warning_days: 30, critical_days: 7 };
const OFF = new Set(["unavailable", "unknown"]);

const thresholds = (config) => {
  const n = (v, d) => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Number(v) : d);
  const warn = n(config?.warning_days, THRESHOLDS.warning_days);
  const crit = n(config?.critical_days, THRESHOLDS.critical_days);
  return [Math.max(warn, crit), crit];
};

// Compact days left, in the card's language: "12d", "12 j", "5h".
const fmtLeft = (ms, loc) => {
  const unit = ms >= DAY ? "day" : "hour";
  const v = Math.max(0, Math.floor(ms / (unit === "day" ? DAY : HOUR)));
  try {
    return new Intl.NumberFormat(loc, { style: "unit", unit, unitDisplay: "narrow" }).format(v);
  } catch (_err) {
    return `${v}${unit === "day" ? "d" : "h"}`;
  }
};

// "in 12 days", "tomorrow", "2 days ago": the language's own phrasing, under a day in hours.
const fmtWhen = (ms, loc) => {
  const abs = Math.abs(ms);
  const [unit, size] = abs >= DAY ? ["day", DAY] : abs >= HOUR ? ["hour", HOUR] : ["minute", 6e4];
  const v = Math.trunc(ms / size);
  try {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(v, unit);
  } catch (_err) {
    return String(v);
  }
};

const fmtDate = (ms, loc, timeZone) => {
  try {
    return new Intl.DateTimeFormat(loc, { dateStyle: "medium", ...(timeZone ? { timeZone } : {}) }).format(new Date(ms));
  } catch (_err) {
    return new Date(ms).toISOString().slice(0, 10);
  }
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard focus, hover
// and CSS transitions survive an update, and only the changed text and attributes are written. Rows carry a data-key
// (their entity id) and are matched by it, wherever they moved; nodes without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));
const isOutside = (card, ev) => !ev.composedPath().includes(card) && !inDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event. `tap(ev)` (press and release at the same spot) is for the tests.
const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

// `entities` / `dns_entities` items: an entity id, or { entity, name }.
const items = (list) =>
  (Array.isArray(list) ? list : [])
    .map((i) => (typeof i === "string" ? { entity: i } : i && typeof i.entity === "string" ? { entity: i.entity, name: i.name } : null))
    .filter(Boolean);

// Entities of an integration, from the entity registry (whatever their ids and the language), in the given domain.
const byPlatform = (hass, platform, domain) =>
  Object.values(hass?.entities || {})
    .filter((e) => e.platform === platform && e.entity_id.startsWith(`${domain}.`) && !e.hidden && hass.states?.[e.entity_id])
    .map((e) => e.entity_id)
    .sort();

// The certificates the card lists: `entities` when set, else every Certificate Expiry sensor (from the registry,
// else by its entity id when the registry is not there), minus `exclude`.
const findCerts = (hass, config = {}) => {
  const exclude = new Set(Array.isArray(config.exclude) ? config.exclude : []);
  let list = items(config.entities);
  if (!list.length) {
    let ids = byPlatform(hass, "cert_expiry", "sensor");
    if (!ids.length && !hass?.entities)
      ids = Object.keys(hass?.states || {})
        .filter((id) => /^sensor\..*cert_expiry/.test(id))
        .sort();
    list = ids.map((entity) => ({ entity }));
  }
  return list.filter((i) => !exclude.has(i.entity));
};

// The DNS checks: `dns_entities` when set, else every DNS IP sensor.
const findDns = (hass, config = {}) => {
  if (config.show_dns === false) return [];
  const list = items(config.dns_entities);
  return list.length ? list : byPlatform(hass, "dnsip", "sensor").map((entity) => ({ entity }));
};

const SUFFIX = /\s*[-–·:]?\s*(cert(ificate)?\s*expiry(\s*timestamp)?|certificate expiration|expiration du certificat)\s*$/i;

// Name of a row: `name` of the item, else the device name (a Certificate Expiry device is named after the host, a DNS
// IP device after the host name), else the friendly name without its "Cert expiry" suffix.
const nameOf = (hass, item) => {
  if (item.name) return item.name;
  const reg = hass?.entities?.[item.entity];
  const dev = reg?.device_id ? hass.devices?.[reg.device_id] : null;
  const devName = dev?.name_by_user || dev?.name;
  if (devName) return devName;
  const fn = hass?.states?.[item.entity]?.attributes?.friendly_name;
  return fn?.replace(SUFFIX, "").trim() || fn || item.entity;
};

// One certificate: { entity, name, cls (ok, warn, crit, idle), kind, expiry (ms), left (ms), error }.
// A timestamp sensor gives the expiry date; a numeric sensor (an older "days left" sensor) the days left.
const certInfo = (hass, config, item, at = now()) => {
  const s = hass?.states?.[item.entity];
  const base = { entity: item.entity, name: nameOf(hass, item), expiry: null, left: null, error: null };
  if (!s || OFF.has(s.state)) return { ...base, cls: "idle", kind: s?.state === "unknown" ? "unknown" : "unavailable" };
  const a = s.attributes || {};
  let expiry = Date.parse(s.state);
  if (!Number.isFinite(expiry) || /^-?\d+(\.\d+)?$/.test(s.state)) {
    const days = Number.parseFloat(s.state);
    if (!Number.isFinite(days)) return { ...base, cls: "idle", kind: "unknown" };
    expiry = at + days * DAY;
  }
  const left = expiry - at;
  const [warn, crit] = thresholds(config);
  const info = { ...base, expiry, left };
  if (a.is_valid === false) return { ...info, cls: "crit", kind: "invalid", error: a.error || null };
  if (left <= 0) return { ...info, cls: "crit", kind: "expired" };
  if (left < crit * DAY) return { ...info, cls: "crit", kind: "expiring" };
  if (left < warn * DAY) return { ...info, cls: "warn", kind: "expiring" };
  return { ...info, cls: "ok", kind: "valid" };
};

// Soonest expiry first; certificates with no date (unavailable, unknown) last, by name.
const sortCerts = (certs) =>
  [...certs].sort((a, b) => (a.expiry ?? Number.POSITIVE_INFINITY) - (b.expiry ?? Number.POSITIVE_INFINITY) || a.name.localeCompare(b.name));

// One DNS check: a sensor (DNS IP) holds the resolved address, empty (unknown) when the name does not resolve; a
// binary sensor (Ping, connectivity) is on when the host answers.
const dnsInfo = (hass, item) => {
  const s = hass?.states?.[item.entity];
  const base = { entity: item.entity, name: nameOf(hass, item), value: null };
  if (!s || s.state === "unavailable") return { ...base, cls: "idle", kind: "state_unavailable" };
  if (item.entity.startsWith("binary_sensor.")) {
    if (s.state === "on") return { ...base, cls: "ok", kind: "reachable" };
    if (s.state === "off") return { ...base, cls: "crit", kind: "unreachable" };
    return { ...base, cls: "idle", kind: "state_unknown" };
  }
  if (s.state === "unknown" || s.state === "") return { ...base, cls: "crit", kind: "not_resolved" };
  return { ...base, cls: "ok", kind: "resolved", value: s.state };
};

// Overall status: the chip of the header and the tint of its icon, with the row it opens.
const summary = (certs, dns) => {
  const first = (pred) => certs.find(pred);
  const pick = (cert, cls, key) => ({ cls, key, entity: cert?.entity });
  const expired = first((c) => c.kind === "expired");
  if (expired) return pick(expired, "crit", "expired");
  const invalid = first((c) => c.kind === "invalid");
  if (invalid) return pick(invalid, "crit", "invalid");
  const soon = first((c) => c.kind === "expiring");
  if (soon) return pick(soon, soon.cls, "expiring");
  const dnsBad = dns.find((d) => d.cls === "crit");
  if (dnsBad) return { cls: "warn", key: "dns_issue", entity: dnsBad.entity };
  const valid = first((c) => c.kind === "valid");
  if (valid) return pick(valid, "ok", "all_valid");
  // DNS checks only: all answering.
  if (!certs.length && dns.length && dns.every((d) => d.cls === "ok")) return { cls: "ok", key: "all_ok", entity: dns[0].entity };
  const allUnknown = certs.length > 0 && certs.every((c) => c.kind === "unknown");
  return { cls: "idle", key: allUnknown ? "state_unknown" : "state_unavailable", entity: (certs[0] || dns[0])?.entity };
};

const problem = (c) => c.cls === "crit" || c.cls === "warn";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --cc-accent: #2e7d32; --cc-ok: var(--success-color, #43a047); --cc-warn: var(--warning-color, #ffa600);
          --cc-crit: var(--error-color, #db4437); --cc-idle: var(--disabled-text-color, #9e9e9e); }
  :host { display: block; }
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no content width: this empty, zero-height grid gives the card a natural width of 300 px with
     no minimum, so it still shrinks to its track in a grid or a flex row. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 300px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--cc-ok); } .warn { --c: var(--cc-warn); } .crit { --c: var(--cc-crit); } .idle { --c: var(--cc-idle); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--cc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--cc-ok)) 15%, transparent); color: var(--c, var(--cc-ok)); white-space: nowrap; }
  .chip.idle { color: var(--primary-text-color); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--cc-ok)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* Tinted round icon, in the colour of the overall status. */
  .logo { height: 40px; width: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--cc-ok)); background: color-mix(in srgb, var(--c, var(--cc-ok)) 16%, transparent); }
  .logo .icon { width: 24px; height: 24px; }
  .titles { flex: 1 1 0; min-width: 5ch; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .header .chip { flex: 0 1 auto; min-width: 0; overflow: hidden; line-height: 16px; box-sizing: border-box; }
  .chip-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* With a subtitle, the chip stays on the title line. */
  .header:has(.sub) .titles { align-self: flex-start; }
  .header:has(.sub) .chip { align-self: flex-start; margin-top: 1px; }
  @container (max-width: 239px) {
    .header { gap: 6px; }
    :host(:not([mini])) .header .logo { height: 32px; width: 32px; }
    :host(:not([mini])) .header .logo .icon { width: 18px; height: 18px; }
    .header .chip { flex: none; padding: 6px; }
    .header .chip .chip-label { display: none; }
  }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--cc-warn); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .left { flex: none; font-size: 12px; font-weight: 500; padding: 1px 8px; border-radius: 10px; white-space: nowrap;
          background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); }
  .left.idle { color: var(--secondary-text-color); }
`;

// Appended last to every card style: with "reduce motion" set, bars and chevrons jump to their new value.
const MOTION_STYLE = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

const FULL_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .count-tile { display: flex; flex-direction: column; align-items: center; padding: 6px 4px; border-radius: 10px; min-width: 0; text-align: center;
                background: color-mix(in srgb, var(--c, var(--secondary-text-color)) 10%, transparent); }
  .count-tile .top { display: flex; align-items: center; gap: 6px; color: var(--c); }
  .count-tile .v { font-size: 16px; font-weight: 500; }
  .count-tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .count-tile.zero { --c: var(--secondary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 4px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .count { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title.fold { cursor: pointer; user-select: none; }
  /* Folded: the chevron points right; unfolded: down (as in ha-carburants-france). */
  .section-title .chevron { transition: transform .2s ease; }
  .section-title.closed { margin-bottom: 0; }
  .section-title.closed .chevron { transform: rotate(-90deg); }
  .list { display: flex; flex-direction: column; }
  .item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--divider-color, rgba(127,127,127,.15)); min-width: 0; }
  .item:last-child { border-bottom: none; }
  .item .ico { width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center;
               color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .item .ico .icon { width: 18px; height: 18px; }
  .item .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .item .title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .detail { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .detail.err { color: var(--cc-crit); }
  .item.dns .ico { width: 24px; height: 24px; }
  .item.dns .ico .icon { width: 14px; height: 14px; }
  .item.dns .value { flex: none; font-size: 12px; color: var(--secondary-text-color); font-family: var(--code-font-family, monospace); }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
`;

const MINI_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* Name column, a bar of at least 24 px, the days left at their width. */
  .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(24px, 72px) auto; align-items: center; gap: 8px; font-size: 13px; }
  .row .lbl { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
  .row .lbl span { overflow: hidden; text-overflow: ellipsis; }
  @container (max-width: 229px) {
    .row { grid-template-columns: minmax(0, 1fr) auto; }
    .row .bar { display: none; }
  }
  .foot { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; flex-wrap: wrap; }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .warn, .foot .crit { color: var(--c); }
  .foot .more { margin-left: auto; }
`;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

class CertificateBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("pointerdown", () => {
      // No update of the card between the press and the release: the patch keeps the nodes in place, but an element
      // appearing in front of the one pressed (a chip, a row) shifts its siblings, so that the element under the
      // pointer can change and the click land elsewhere or nowhere. The pending render is done once released (after
      // the click).
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click (same task): a press with no click (released elsewhere) draws what it held back.
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults (as in ha-carburants-france).
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._folds || !Object.keys(this._folds).length) return;
        this._folds = {};
        this._update();
      },
    );
    this._outside.on();
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
    // The days left move on with time: checked every minute, rendered only when a value shown changed.
    this._timer ??= setInterval(() => {
      if (this._hass && this._config && !sameSig(this._signature(), this._sig)) this._update();
    }, 60000);
  }

  disconnectedCallback() {
    this._outside?.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded.
    this._folds = {};
    clearInterval(this._timer);
    this._timer = undefined;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._folds = {};
    this._html = "";
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  // The certificates (sorted by expiry) and the DNS checks the card shows.
  _model() {
    const at = now();
    const certs = sortCerts(findCerts(this._hass, this._config).map((i) => certInfo(this._hass, this._config, i, at)));
    const dns = findDns(this._hass, this._config).map((i) => dnsInfo(this._hass, i));
    return { certs, dns, at };
  }

  // What the render depends on: registries, language, the minute and the states of the listed entities.
  _signature() {
    const h = this._hass;
    const sig = [h.entities, h.devices, h.language, h.locale?.language, Math.floor(now() / 6e4)];
    for (const i of [...findCerts(h, this._config), ...findDns(h, this._config)]) sig.push(h.states?.[i.entity]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    // Not under a press (see the pointerdown listener): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  _onClick(ev) {
    this._pressing = false;
    const el = ev.composedPath().find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    if (el.dataset.action === "fold") {
      const key = el.dataset.section;
      this._folds = { ...this._folds, [key]: !this._isOpen(key) };
      this._update();
    } else if (el.dataset.entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    }
  }

  _isOpen(key) {
    return this._folds?.[key] ?? this._config[`expand_${key}`] === true;
  }

  // "Next expiry in 4 days", from the soonest certificate still valid.
  _subtitle(certs, at) {
    const next = certs.find((c) => c.left !== null && c.left > 0);
    return next ? this._t("next_expiry", { when: fmtWhen(next.expiry - at, this._loc()) }) : "";
  }

  _header(certs, dns, at) {
    const st = summary(certs, dns);
    const label = esc(this._t(st.key));
    const sub = this._subtitle(certs, at);
    return `
      <div class="header">
        <div class="logo ${st.cls}" aria-hidden="true">${svgIcon(ICONS.certificate)}</div>
        <div class="titles">
          <div class="name">${esc(this._config.title || this._t("certificates"))}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        <span class="chip ${st.cls}${st.entity ? " clickable" : ""}"${st.entity ? ` role="button" tabindex="0" data-entity="${esc(st.entity)}"` : ""} title="${label}" aria-label="${label}"><span class="dot"></span><span class="chip-label">${label}</span></span>
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  // Days left of a certificate, as a badge: "12d", "Expired", "Invalid", or its state.
  _badge(c) {
    const text =
      c.kind === "expired" || c.kind === "invalid" ? this._t(c.kind) : c.left !== null ? fmtLeft(c.left, this._loc()) : this._t(`state_${c.kind}`);
    return `<span class="left ${c.cls}">${esc(text)}</span>`;
  }

  _bar(c) {
    const pct = c.left === null ? 0 : Math.max(0, Math.min(100, (100 * c.left) / (BAR_DAYS * DAY)));
    return `<div class="bar ${c.cls}"><div style="width:${pct.toFixed(1)}%"></div></div>`;
  }

  _error(key) {
    return `<style>${BASE_STYLE}${MOTION_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }
}

class CertificateCard extends CertificateBase {
  static getConfigElement() {
    return document.createElement("certificate-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  // Rows of about 50 px: header, counters, certificates, then the DNS title and, when open, its rows.
  getCardSize() {
    if (!this._hass || !this._config) return 3;
    const { certs, dns } = this._model();
    const c = this._config;
    const listed = c.only_problems ? certs.filter(problem).length || 1 : certs.length;
    return 1 + (c.show_counts !== false ? 1 : 0) + listed + (dns.length ? 1 + (this._isOpen("dns") ? dns.length : 0) : 0);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { certs, dns, at } = this._model();
    if (!certs.length && !dns.length) return this._error("no_certs");
    const c = this._config;
    const parts = [];
    if (c.show_counts !== false && certs.length) parts.push(this._counts(certs));
    if (certs.length) parts.push(this._certList(certs, at));
    if (dns.length) parts.push(this._dnsSection(dns));
    return `<style>${BASE_STYLE}${FULL_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(certs, dns, at)}
        <div class="content">${parts.join("")}</div>
      </ha-card>`;
  }

  _counts(certs) {
    const valid = certs.filter((x) => x.kind === "valid").length;
    const soon = certs.filter((x) => x.kind === "expiring");
    const gone = certs.filter((x) => x.kind === "expired" || x.kind === "invalid").length;
    const soonCls = soon.some((x) => x.cls === "crit") ? "crit" : "warn";
    const tile = (cls, icon, v, key) =>
      `<div class="count-tile ${v ? cls : "zero"}" aria-label="${esc(this._t(key))} ${v}"><div class="top">${svgIcon(icon)}<span class="v">${v}</span></div><div class="k">${esc(this._t(key))}</div></div>`;
    return `<div class="counts">${tile("ok", ICONS.lock, valid, "valid")}${tile(soonCls, ICONS.sand, soon.length, "expiring")}${tile("crit", ICONS.lockAlert, gone, "expired")}</div>`;
  }

  _certList(certs, at) {
    const c = this._config;
    const shown = c.only_problems ? certs.filter(problem) : certs;
    const loc = this._loc();
    const tz = this._hass.config?.time_zone;
    const rows = shown.map((x) => {
      let detail = "";
      let err = false;
      if (x.kind === "invalid" && x.error) {
        detail = x.error;
        err = true;
      } else if (x.expiry !== null && c.show_date !== false) {
        detail = this._t(x.left > 0 ? "expires_on" : "expired_on", { date: fmtDate(x.expiry, loc, tz) });
      } else if (x.expiry !== null) {
        detail = fmtWhen(x.expiry - at, loc);
      } else {
        detail = this._t(`state_${x.kind}`);
      }
      const icon = x.cls === "crit" ? ICONS.lockAlert : x.cls === "warn" ? ICONS.sand : ICONS.lock;
      return `<div class="item cert clickable ${x.cls}" role="button" tabindex="0" data-key="${esc(x.entity)}" data-entity="${esc(x.entity)}" aria-label="${esc(`${x.name}: ${detail}`)}">
        <div class="ico">${svgIcon(icon)}</div>
        <div class="main"><div class="title">${esc(x.name)}</div><div class="detail${err ? " err" : ""}">${esc(detail)}</div>${this._bar(x)}</div>
        ${this._badge(x)}
      </div>`;
    });
    return `<div class="list certs">${rows.length ? rows.join("") : `<div class="empty">✓ ${esc(this._t("all_ok"))}</div>`}</div>`;
  }

  _dnsSection(dns) {
    const open = this._isOpen("dns");
    const ok = dns.filter((d) => d.cls === "ok").length;
    const rows = dns.map((d) => {
      const icon = d.cls === "ok" ? ICONS.check : d.cls === "crit" ? ICONS.alert : ICONS.dns;
      const text = this._t(d.kind);
      return `<div class="item dns clickable ${d.cls}" role="button" tabindex="0" data-key="${esc(d.entity)}" data-entity="${esc(d.entity)}" aria-label="${esc(`${d.name}: ${d.value ?? text}`)}">
        <div class="ico">${svgIcon(icon)}</div>
        <div class="main"><div class="title">${esc(d.name)}</div><div class="detail">${esc(text)}</div></div>
        ${d.value ? `<span class="value">${esc(d.value)}</span>` : ""}
      </div>`;
    });
    return `<div>
      <div class="section-title fold ${open ? "" : "closed"}" role="button" tabindex="0" aria-expanded="${open}" data-action="fold" data-section="dns">${svgIcon(ICONS.dns)}${esc(
        this._t("dns")
      )}<span class="count">${ok}/${dns.length}</span>${svgIcon(ICONS.chevron, "chevron")}</div>
      ${open ? `<div class="list">${rows.join("")}</div>` : ""}
    </div>`;
  }
}

// The mini card extends the full card: its detail button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class CertificateMiniCard extends CertificateCard {
  static getConfigElement() {
    return document.createElement("certificate-mini-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    this._unzoom = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  // A config change (the editor, say) starts over from the compact view.
  setConfig(config) {
    this._zoomed = false;
    this.setAttribute("mini", "");
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2 + Math.min(this._max(), 5);
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _max() {
    const n = Number(this._config?.max_items);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update();
  }

  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button, without scrolling the view.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button type="button" class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}" aria-label="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(
      z ? ICONS.collapse : ICONS.expand
    )}</button>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { certs, dns, at } = this._model();
    if (!certs.length && !dns.length) return this._error("no_certs");
    const rows = certs.slice(0, this._max()).map(
      (x) => `<div class="row clickable ${x.cls}" role="button" tabindex="0" data-key="${esc(x.entity)}" data-entity="${esc(x.entity)}" aria-label="${esc(x.name)}">
        <span class="lbl"><span class="dot"></span><span>${esc(x.name)}</span></span>${this._bar(x)}${this._badge(x)}
      </div>`
    );
    const foot = [];
    if (certs.length) {
      const bad = certs.filter(problem).length;
      foot.push(`<span title="${esc(this._t("certificates"))}">${svgIcon(ICONS.lock)}${certs.length}</span>`);
      if (bad) foot.push(`<span class="${certs.some((x) => x.cls === "crit") ? "crit" : "warn"}" title="${esc(this._t("expiring"))}">${svgIcon(ICONS.alert)}${bad}</span>`);
    }
    if (dns.length) {
      const ok = dns.filter((d) => d.cls === "ok").length;
      const bad = dns.find((d) => d.cls === "crit");
      foot.push(
        `<span class="clickable ${bad ? "crit" : ""}" role="button" tabindex="0" data-key="dns" data-entity="${esc((bad ?? dns[0]).entity)}" title="${esc(this._t("dns"))}">${svgIcon(ICONS.dns)}${ok}/${dns.length}</span>`
      );
    }
    const more = certs.length - rows.length;
    if (more > 0) foot.push(`<span class="more">${esc(this._t("more", { n: more }))}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(certs, dns, at)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const CERT_FILTER = [{ integration: "cert_expiry" }, { domain: "sensor", device_class: "timestamp" }];
const DNS_FILTER = [{ integration: "dnsip" }, { domain: "binary_sensor" }];

class CertificateEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get numbers() {
    return { ...THRESHOLDS };
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const numbers = this.constructor.numbers;
    return [
      { name: "title", selector: { text: {} } },
      { name: "entities", selector: { entity: { multiple: true, filter: CERT_FILTER } } },
      { name: "exclude", selector: { entity: { multiple: true, filter: CERT_FILTER } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        type: "grid",
        name: "",
        schema: Object.keys(numbers).map((name) => ({
          name,
          selector: { number: { min: name === "max_items" ? 1 : 0, max: name === "max_items" ? 20 : 365, step: 1, mode: "box" } },
        })),
      },
      { name: "dns_entities", selector: { entity: { multiple: true, filter: DNS_FILTER } } },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const defaults = { ...Object.fromEntries(this.constructor.toggles), ...this.constructor.numbers };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // A row renamed in YAML ({ entity, name }) keeps its name while it stays selected.
        for (const key of ["entities", "dns_entities"]) {
          if (!Array.isArray(config[key])) continue;
          const named = new Map(items(this._config[key]).filter((i) => i.name).map((i) => [i.entity, i]));
          config[key] = config[key].map((id) => named.get(id) ?? id);
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length) || (k in defaults && v === defaults[k])) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...defaults, ...this._config };
    for (const key of ["entities", "dns_entities"]) if (Array.isArray(data[key])) data[key] = items(data[key]).map((i) => i.entity);
    this._form.hass = this._hass;
    // hass is pushed on every state change while the editor is open: reassign data and schema only when they changed.
    const dataKey = JSON.stringify(data);
    if (dataKey !== this._dataKey) {
      this._dataKey = dataKey;
      this._form.data = data;
    }
    const schemaKey = lang(this._hass, this._config);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._form.schema = this._schema();
    }
  }
}

class CertificateCardEditor extends CertificateEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_counts", true],
      ["show_date", true],
      ["only_problems", false],
      ["show_dns", true],
      ["expand_dns", false],
    ];
  }
}

class CertificateMiniCardEditor extends CertificateEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_dns", true],
      ["zoom", true],
    ];
  }

  static get numbers() {
    return { ...THRESHOLDS, max_items: 3 };
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("certificate-card", CertificateCard);
define("certificate-mini-card", CertificateMiniCard);
define("certificate-card-editor", CertificateCardEditor);
define("certificate-mini-card-editor", CertificateMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "certificate-card",
    name: "Certificate Card",
    description: "SSL/TLS certificates monitored by Certificate Expiry: days left, expiry dates and basic DNS checks.",
  },
  {
    type: "certificate-mini-card",
    name: "Certificate Mini Card",
    description: "Compact view of the certificates expiring next (Certificate Expiry), with DNS checks.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-certificate-card" });
}

console.info(
  `%c CERTIFICATE-CARD %c v${VERSION} `,
  "color: white; background: #2e7d32; font-weight: 700;",
  "color: #2e7d32; background: white; font-weight: 700;"
);
