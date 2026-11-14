/*
 * ScanHarvest — translations.
 * Shared by the popup, the on-page panel (content script) and the background worker.
 * The chosen language is stored in chrome.storage.local under "lang".
 * To add a language: add it to LANGS, add a dictionary below, and a flag in flags.js.
 */
globalThis.I18N = (() => {
  const LANGS = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'fa', name: 'فارسی', dir: 'rtl' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'zh', name: '中文', dir: 'ltr' }
  ];

  const STRINGS = {
    en: {
      appName: 'ScanHarvest',
      tagline: 'Free Quixel Megascans, straight to your Fab library',
      language: 'Language',
      status_idle: 'Ready', status_running: 'Running', status_paused: 'Paused', status_finished: 'Finished', status_error: 'Needs attention',
      stat_added: 'assets added', stat_owned: 'Already owned', stat_failed: 'Need retry', stat_time: 'Time', stat_eta: 'Time left',
      btn_start: 'Start claiming', btn_resume: 'Resume', btn_pause: 'Pause', btn_retry: 'Retry {n} item(s)',
      btn_check_again: 'Check again for new items', btn_open_start: 'Open Fab Megascans & start', btn_open_resume: 'Open Fab Megascans & resume',
      btn_show_progress: 'Show progress on the page', btn_go_tab: 'Go to the running tab',
      hint_open_fab: 'Opens the Free Quixel Megascans page in this tab.',
      hint_open_other: 'Opens fab.com in this tab. Make sure you are signed in there.',
      warn_hidden: 'The Fab tab is in the background, so the browser slows it down. Switch back to it, or give it its own window, for full speed.',
      warn_unready: 'This page was opened before the extension was ready. Starting will reload it first.',
      warn_permission: "Firefox needs your permission to run on fab.com.", btn_grant: "Allow access to fab.com",
      intro: 'Adds every free Quixel Megascans listing on Fab to your library, one by one, using Fab’s own button.',
      tips_title: 'Before you start',
      tip1: 'Sign in at <b>fab.com</b> with your Epic Games account.',
      tip2: 'Faster runs: on Fab open <b>User preferences</b>, turn off <b>Show products in My Library</b> and save.',
      tip3: 'Keep the Fab tab open and visible. A full run takes a few hours; you can pause any time.',
      tip4: 'This only adds items to your library. Download them later in Fab, Unreal Engine or Bridge.',
      reset: 'Start over', reset_confirm: 'Forget progress on this computer and start counting from zero? Items already in your Fab library stay there.',
      copy_failed: 'Copy items that need a retry', copied: 'Copied!',
      ov_added: 'Added now', ov_owned: 'Already in library', ov_failed: 'Need another try', ov_time: 'Time',
      ov_hide: 'Hide', ov_hide_title: 'Hide this panel. The claimer keeps running.', ov_close: 'Close',
      ov_close_confirm: 'Pause the claimer and close the panel?', ov_run_again: 'Run again', ov_retry: 'Retry',
      ov_note: 'Keep this tab open and visible for best speed. You can hide the panel and keep using Fab in this tab, just don’t navigate away.',
      ov_chip: '{status} · {n} added', ov_workspace: 'Fab claim workspace',
      m_intro: 'Ready when you are.',
      m_starting: 'Starting…', m_opening: 'Opening the Megascans catalog…', m_loading_more: 'Loading more listings…',
      m_adding: 'Adding: {title}', m_retry_in: 'Fab is slow to respond. Retrying in {s}s…',
      m_slow_down: 'Fab asked us to slow down. Waiting {s}s…', m_pausing: 'Pausing…',
      m_paused_user: 'Paused. Click Resume to continue where you left off.',
      m_done_all: 'Done! Every free Megascans listing is in your library.',
      m_done_some: 'Done! {n} listing(s) need another try. Click Retry.',
      m_tab_closed: 'The Fab tab was closed. Open the extension and click Resume.',
      m_interrupted: 'The run was interrupted (page reloaded or browser closed). Click Resume to continue.',
      e_address: 'Unexpected address. Stopped for safety.',
      e_catalog: 'Fab’s catalog did not load after three tries. Check your connection and click Resume.',
      e_filter: 'Could not confirm the Free filter on Fab. Reload the page and try again.',
      e_results: 'Fab did not show any results. Click Resume to try again.',
      e_load_more: 'Fab stopped loading more results. Click Resume to continue from here.',
      e_sign_in: 'It looks like you are not signed in. Sign in to Fab with your Epic Games account, then click Start.',
      e_fail_streak: 'Several claims in a row could not be confirmed. Fab may be busy. Click Resume in a few minutes.',
      e_rate_limit: 'Fab asked us to slow down several times. Take a break and click Resume in about an hour.',
      e_unknown: 'Something unexpected happened. Click Resume to continue.',
      n_finished: 'ScanHarvest finished', n_paused: 'ScanHarvest paused', n_error: 'ScanHarvest needs attention',
      n_body: 'Added: {a} · Already owned: {o}'
    },

    fa: {
      appName: 'ScanHarvest',
      tagline: 'Quixel Megascans رایگان، مستقیم به کتابخانه Fab شما',
      language: 'زبان',
      status_idle: 'آماده', status_running: 'در حال اجرا', status_paused: 'متوقف', status_finished: 'تمام شد', status_error: 'نیاز به بررسی',
      stat_added: 'دارایی اضافه شد', stat_owned: 'از قبل دارید', stat_failed: 'نیاز به تلاش مجدد', stat_time: 'زمان', stat_eta: 'زمان باقی‌مانده',
      btn_start: 'شروع دریافت', btn_resume: 'ادامه', btn_pause: 'توقف', btn_retry: 'تلاش مجدد برای {n} مورد',
      btn_check_again: 'بررسی دوباره برای موارد جدید', btn_open_start: 'باز کردن Fab Megascans و شروع', btn_open_resume: 'باز کردن Fab Megascans و ادامه',
      btn_show_progress: 'نمایش پیشرفت روی صفحه', btn_go_tab: 'رفتن به زبانه در حال اجرا',
      hint_open_fab: 'صفحه Quixel Megascans رایگان را در همین زبانه باز می‌کند.',
      hint_open_other: 'سایت fab.com را در همین زبانه باز می‌کند. مطمئن شوید آنجا وارد حساب خود شده‌اید.',
      warn_hidden: 'زبانه Fab در پس‌زمینه است و مرورگر آن را کند می‌کند. برای سرعت کامل به آن برگردید یا آن را در یک پنجره جداگانه باز کنید.',
      warn_unready: 'این صفحه قبل از آماده شدن افزونه باز شده است. با شروع، ابتدا صفحه دوباره بارگذاری می‌شود.',
      warn_permission: "فایرفاکس برای اجرا روی fab.com به اجازه شما نیاز دارد.", btn_grant: "اجازه دسترسی به fab.com",
      intro: 'همه دارایی‌های رایگان Quixel Megascans در Fab را یکی‌یکی و با دکمه خود Fab به کتابخانه شما اضافه می‌کند.',
      tips_title: 'پیش از شروع',
      tip1: 'در <b>fab.com</b> با حساب Epic Games خود وارد شوید.',
      tip2: 'برای سرعت بیشتر: در Fab بخش <b>User preferences</b> را باز کنید، گزینه <b>Show products in My Library</b> را خاموش و ذخیره کنید.',
      tip3: 'زبانه Fab را باز و قابل‌مشاهده نگه دارید. اجرای کامل چند ساعت طول می‌کشد و هر زمان می‌توانید آن را متوقف کنید.',
      tip4: 'این ابزار فقط موارد را به کتابخانه شما اضافه می‌کند. دانلود را بعداً از Fab، آنریل انجین یا Bridge انجام دهید.',
      reset: 'شروع از نو', reset_confirm: 'پیشرفت ذخیره‌شده در این رایانه پاک شود و شمارش از صفر شروع شود؟ مواردی که در کتابخانه Fab شما هستند باقی می‌مانند.',
      copy_failed: 'کپی موارد نیازمند تلاش مجدد', copied: 'کپی شد!',
      ov_added: 'اضافه‌شده', ov_owned: 'از قبل در کتابخانه', ov_failed: 'نیاز به تلاش مجدد', ov_time: 'زمان',
      ov_hide: 'پنهان کردن', ov_hide_title: 'این پنل را پنهان کنید؛ کار ادامه پیدا می‌کند.', ov_close: 'بستن',
      ov_close_confirm: 'کار متوقف و پنل بسته شود؟', ov_run_again: 'اجرای دوباره', ov_retry: 'تلاش مجدد',
      ov_note: 'برای بیشترین سرعت این زبانه را باز و قابل‌مشاهده نگه دارید. می‌توانید پنل را پنهان کنید و در همین زبانه از Fab استفاده کنید، فقط از صفحه خارج نشوید.',
      ov_chip: '{status} · {n} اضافه شد', ov_workspace: 'فضای کار دریافت Fab',
      m_intro: 'هر وقت آماده بودید شروع کنید.',
      m_starting: 'در حال شروع…', m_opening: 'در حال باز کردن فهرست Megascans…', m_loading_more: 'در حال بارگذاری موارد بیشتر…',
      m_adding: 'در حال اضافه کردن: {title}', m_retry_in: 'Fab کند پاسخ می‌دهد. تلاش دوباره تا {s} ثانیه دیگر…',
      m_slow_down: 'Fab خواست سرعت را کم کنیم. صبر برای {s} ثانیه…', m_pausing: 'در حال توقف…',
      m_paused_user: 'متوقف شد. برای ادامه از همان‌جا روی «ادامه» بزنید.',
      m_done_all: 'تمام شد! همه دارایی‌های رایگان Megascans در کتابخانه شماست.',
      m_done_some: 'تمام شد! {n} مورد نیاز به تلاش مجدد دارد. روی «تلاش مجدد» بزنید.',
      m_tab_closed: 'زبانه Fab بسته شد. افزونه را باز کنید و روی «ادامه» بزنید.',
      m_interrupted: 'اجرا قطع شد (صفحه دوباره بارگذاری یا مرورگر بسته شد). برای ادامه روی «ادامه» بزنید.',
      e_address: 'آدرس غیرمنتظره؛ برای امنیت متوقف شد.',
      e_catalog: 'فهرست Fab پس از سه بار تلاش بارگذاری نشد. اتصال خود را بررسی کنید و روی «ادامه» بزنید.',
      e_filter: 'فیلتر «رایگان» در Fab تأیید نشد. صفحه را دوباره بارگذاری و دوباره امتحان کنید.',
      e_results: 'Fab هیچ نتیجه‌ای نشان نداد. برای تلاش دوباره روی «ادامه» بزنید.',
      e_load_more: 'Fab بارگذاری نتایج بیشتر را متوقف کرد. برای ادامه از همین‌جا روی «ادامه» بزنید.',
      e_sign_in: 'به نظر می‌رسد وارد حساب نشده‌اید. با حساب Epic Games وارد Fab شوید و سپس روی «شروع» بزنید.',
      e_fail_streak: 'چند مورد پشت سر هم تأیید نشد. ممکن است Fab شلوغ باشد. چند دقیقه بعد روی «ادامه» بزنید.',
      e_rate_limit: 'Fab چند بار خواست سرعت را کم کنیم. کمی استراحت کنید و حدود یک ساعت بعد روی «ادامه» بزنید.',
      e_unknown: 'مشکل غیرمنتظره‌ای پیش آمد. برای ادامه روی «ادامه» بزنید.',
      n_finished: 'ScanHarvest تمام شد', n_paused: 'ScanHarvest متوقف شد', n_error: 'ScanHarvest نیاز به بررسی دارد',
      n_body: 'اضافه‌شده: {a} · از قبل داشتید: {o}'
    },

    fr: {
      appName: 'ScanHarvest',
      tagline: 'Les Quixel Megascans gratuits, directement dans votre bibliothèque Fab',
      language: 'Langue',
      status_idle: 'Prêt', status_running: 'En cours', status_paused: 'En pause', status_finished: 'Terminé', status_error: 'Action requise',
      stat_added: 'ressources ajoutées', stat_owned: 'Déjà possédées', stat_failed: 'À réessayer', stat_time: 'Durée', stat_eta: 'Restant',
      btn_start: 'Commencer', btn_resume: 'Reprendre', btn_pause: 'Pause', btn_retry: 'Réessayer {n} élément(s)',
      btn_check_again: 'Rechercher de nouveaux éléments', btn_open_start: 'Ouvrir Fab Megascans et commencer', btn_open_resume: 'Ouvrir Fab Megascans et reprendre',
      btn_show_progress: 'Afficher la progression sur la page', btn_go_tab: 'Aller à l’onglet en cours',
      hint_open_fab: 'Ouvre la page Quixel Megascans gratuits dans cet onglet.',
      hint_open_other: 'Ouvre fab.com dans cet onglet. Vérifiez que vous y êtes connecté.',
      warn_hidden: 'L’onglet Fab est en arrière-plan, le navigateur le ralentit. Revenez-y, ou placez-le dans sa propre fenêtre, pour une vitesse maximale.',
      warn_unready: 'Cette page a été ouverte avant que l’extension soit prête. Elle sera rechargée au démarrage.',
      warn_permission: "Firefox a besoin de votre autorisation pour fonctionner sur fab.com.", btn_grant: "Autoriser l’accès à fab.com",
      intro: 'Ajoute un par un tous les Quixel Megascans gratuits de Fab à votre bibliothèque, avec le bouton de Fab.',
      tips_title: 'Avant de commencer',
      tip1: 'Connectez-vous sur <b>fab.com</b> avec votre compte Epic Games.',
      tip2: 'Plus rapide : dans Fab, ouvrez <b>User preferences</b>, désactivez <b>Show products in My Library</b> et enregistrez.',
      tip3: 'Gardez l’onglet Fab ouvert et visible. Une exécution complète prend quelques heures ; vous pouvez mettre en pause à tout moment.',
      tip4: 'L’outil ajoute seulement les éléments à votre bibliothèque. Téléchargez-les ensuite dans Fab, Unreal Engine ou Bridge.',
      reset: 'Recommencer', reset_confirm: 'Effacer la progression sur cet ordinateur et repartir de zéro ? Les éléments déjà dans votre bibliothèque Fab y restent.',
      copy_failed: 'Copier les éléments à réessayer', copied: 'Copié !',
      ov_added: 'Ajoutées', ov_owned: 'Déjà en bibliothèque', ov_failed: 'À réessayer', ov_time: 'Durée',
      ov_hide: 'Masquer', ov_hide_title: 'Masquer ce panneau. L’outil continue de tourner.', ov_close: 'Fermer',
      ov_close_confirm: 'Mettre en pause et fermer le panneau ?', ov_run_again: 'Relancer', ov_retry: 'Réessayer',
      ov_note: 'Gardez cet onglet ouvert et visible pour une vitesse optimale. Vous pouvez masquer le panneau et utiliser Fab dans cet onglet, sans quitter la page.',
      ov_chip: '{status} · {n} ajoutées', ov_workspace: 'Espace de travail Fab',
      m_intro: 'Prêt quand vous l’êtes.',
      m_starting: 'Démarrage…', m_opening: 'Ouverture du catalogue Megascans…', m_loading_more: 'Chargement d’autres éléments…',
      m_adding: 'Ajout : {title}', m_retry_in: 'Fab répond lentement. Nouvel essai dans {s} s…',
      m_slow_down: 'Fab demande de ralentir. Attente de {s} s…', m_pausing: 'Mise en pause…',
      m_paused_user: 'En pause. Cliquez sur Reprendre pour continuer là où vous vous êtes arrêté.',
      m_done_all: 'Terminé ! Tous les Megascans gratuits sont dans votre bibliothèque.',
      m_done_some: 'Terminé ! {n} élément(s) à réessayer. Cliquez sur Réessayer.',
      m_tab_closed: 'L’onglet Fab a été fermé. Ouvrez l’extension et cliquez sur Reprendre.',
      m_interrupted: 'L’exécution a été interrompue (page rechargée ou navigateur fermé). Cliquez sur Reprendre.',
      e_address: 'Adresse inattendue. Arrêt par sécurité.',
      e_catalog: 'Le catalogue Fab ne s’est pas chargé après trois essais. Vérifiez votre connexion puis cliquez sur Reprendre.',
      e_filter: 'Impossible de confirmer le filtre « Free » sur Fab. Rechargez la page et réessayez.',
      e_results: 'Fab n’affiche aucun résultat. Cliquez sur Reprendre pour réessayer.',
      e_load_more: 'Fab ne charge plus de résultats. Cliquez sur Reprendre pour continuer à partir d’ici.',
      e_sign_in: 'Vous ne semblez pas connecté. Connectez-vous à Fab avec votre compte Epic Games, puis cliquez sur Commencer.',
      e_fail_streak: 'Plusieurs ajouts d’affilée n’ont pas été confirmés. Fab est peut-être surchargé. Cliquez sur Reprendre dans quelques minutes.',
      e_rate_limit: 'Fab a demandé plusieurs fois de ralentir. Faites une pause et cliquez sur Reprendre dans environ une heure.',
      e_unknown: 'Une erreur inattendue s’est produite. Cliquez sur Reprendre pour continuer.',
      n_finished: 'ScanHarvest a terminé', n_paused: 'ScanHarvest en pause', n_error: 'ScanHarvest : action requise',
      n_body: 'Ajoutées : {a} · Déjà possédées : {o}'
    },

    de: {
      appName: 'ScanHarvest',
      tagline: 'Kostenlose Quixel Megascans direkt in deine Fab-Bibliothek',
      language: 'Sprache',
      status_idle: 'Bereit', status_running: 'Läuft', status_paused: 'Pausiert', status_finished: 'Fertig', status_error: 'Aktion nötig',
      stat_added: 'Assets hinzugefügt', stat_owned: 'Bereits vorhanden', stat_failed: 'Erneut versuchen', stat_time: 'Zeit', stat_eta: 'Verbleibend',
      btn_start: 'Jetzt starten', btn_resume: 'Fortsetzen', btn_pause: 'Pausieren', btn_retry: '{n} Element(e) erneut versuchen',
      btn_check_again: 'Nach neuen Elementen suchen', btn_open_start: 'Fab Megascans öffnen & starten', btn_open_resume: 'Fab Megascans öffnen & fortsetzen',
      btn_show_progress: 'Fortschritt auf der Seite zeigen', btn_go_tab: 'Zum laufenden Tab',
      hint_open_fab: 'Öffnet die Seite mit den kostenlosen Quixel Megascans in diesem Tab.',
      hint_open_other: 'Öffnet fab.com in diesem Tab. Stelle sicher, dass du dort angemeldet bist.',
      warn_hidden: 'Der Fab-Tab ist im Hintergrund, deshalb bremst der Browser ihn. Wechsle zurück oder gib ihm ein eigenes Fenster für volle Geschwindigkeit.',
      warn_unready: 'Diese Seite wurde geöffnet, bevor die Erweiterung bereit war. Beim Start wird sie zuerst neu geladen.',
      warn_permission: "Firefox braucht deine Erlaubnis, um auf fab.com zu laufen.", btn_grant: "Zugriff auf fab.com erlauben",
      intro: 'Fügt alle kostenlosen Quixel Megascans auf Fab nacheinander deiner Bibliothek hinzu, mit Fabs eigenem Button.',
      tips_title: 'Bevor du startest',
      tip1: 'Melde dich auf <b>fab.com</b> mit deinem Epic-Games-Konto an.',
      tip2: 'Schneller: Öffne in Fab <b>User preferences</b>, deaktiviere <b>Show products in My Library</b> und speichere.',
      tip3: 'Lass den Fab-Tab offen und sichtbar. Ein kompletter Durchlauf dauert einige Stunden; du kannst jederzeit pausieren.',
      tip4: 'Das Tool fügt Elemente nur deiner Bibliothek hinzu. Herunterladen kannst du sie später in Fab, Unreal Engine oder Bridge.',
      reset: 'Neu beginnen', reset_confirm: 'Fortschritt auf diesem Computer vergessen und bei null beginnen? Elemente in deiner Fab-Bibliothek bleiben erhalten.',
      copy_failed: 'Fehlgeschlagene Elemente kopieren', copied: 'Kopiert!',
      ov_added: 'Hinzugefügt', ov_owned: 'Schon in der Bibliothek', ov_failed: 'Erneut versuchen', ov_time: 'Zeit',
      ov_hide: 'Ausblenden', ov_hide_title: 'Panel ausblenden. Der Vorgang läuft weiter.', ov_close: 'Schließen',
      ov_close_confirm: 'Vorgang pausieren und Panel schließen?', ov_run_again: 'Erneut ausführen', ov_retry: 'Erneut versuchen',
      ov_note: 'Lass diesen Tab für beste Geschwindigkeit offen und sichtbar. Du kannst das Panel ausblenden und Fab in diesem Tab nutzen, verlasse aber die Seite nicht.',
      ov_chip: '{status} · {n} hinzugefügt', ov_workspace: 'Fab-Arbeitsbereich',
      m_intro: 'Bereit, wenn du es bist.',
      m_starting: 'Wird gestartet…', m_opening: 'Megascans-Katalog wird geöffnet…', m_loading_more: 'Weitere Einträge werden geladen…',
      m_adding: 'Wird hinzugefügt: {title}', m_retry_in: 'Fab antwortet langsam. Neuer Versuch in {s} s…',
      m_slow_down: 'Fab bittet um eine Pause. Warte {s} s…', m_pausing: 'Wird pausiert…',
      m_paused_user: 'Pausiert. Klicke auf Fortsetzen, um dort weiterzumachen, wo du aufgehört hast.',
      m_done_all: 'Fertig! Alle kostenlosen Megascans sind in deiner Bibliothek.',
      m_done_some: 'Fertig! {n} Element(e) brauchen einen neuen Versuch. Klicke auf Erneut versuchen.',
      m_tab_closed: 'Der Fab-Tab wurde geschlossen. Öffne die Erweiterung und klicke auf Fortsetzen.',
      m_interrupted: 'Der Vorgang wurde unterbrochen (Seite neu geladen oder Browser geschlossen). Klicke auf Fortsetzen.',
      e_address: 'Unerwartete Adresse. Aus Sicherheitsgründen gestoppt.',
      e_catalog: 'Fabs Katalog wurde nach drei Versuchen nicht geladen. Prüfe deine Verbindung und klicke auf Fortsetzen.',
      e_filter: 'Der Free-Filter auf Fab konnte nicht bestätigt werden. Lade die Seite neu und versuche es erneut.',
      e_results: 'Fab zeigt keine Ergebnisse. Klicke auf Fortsetzen, um es erneut zu versuchen.',
      e_load_more: 'Fab lädt keine weiteren Ergebnisse. Klicke auf Fortsetzen, um von hier weiterzumachen.',
      e_sign_in: 'Du scheinst nicht angemeldet zu sein. Melde dich mit deinem Epic-Games-Konto bei Fab an und klicke dann auf Starten.',
      e_fail_streak: 'Mehrere Elemente nacheinander wurden nicht bestätigt. Fab ist vielleicht ausgelastet. Klicke in ein paar Minuten auf Fortsetzen.',
      e_rate_limit: 'Fab hat mehrmals um eine Pause gebeten. Mach eine Pause und klicke in etwa einer Stunde auf Fortsetzen.',
      e_unknown: 'Etwas Unerwartetes ist passiert. Klicke auf Fortsetzen, um weiterzumachen.',
      n_finished: 'ScanHarvest ist fertig', n_paused: 'ScanHarvest pausiert', n_error: 'ScanHarvest: Aktion nötig',
      n_body: 'Hinzugefügt: {a} · Bereits vorhanden: {o}'
    },

    es: {
      appName: 'ScanHarvest',
      tagline: 'Quixel Megascans gratis, directo a tu biblioteca de Fab',
      language: 'Idioma',
      status_idle: 'Listo', status_running: 'En curso', status_paused: 'En pausa', status_finished: 'Terminado', status_error: 'Requiere atención',
      stat_added: 'recursos añadidos', stat_owned: 'Ya los tenías', stat_failed: 'Por reintentar', stat_time: 'Tiempo', stat_eta: 'Restante',
      btn_start: 'Empezar', btn_resume: 'Reanudar', btn_pause: 'Pausar', btn_retry: 'Reintentar {n} elemento(s)',
      btn_check_again: 'Buscar elementos nuevos', btn_open_start: 'Abrir Fab Megascans y empezar', btn_open_resume: 'Abrir Fab Megascans y reanudar',
      btn_show_progress: 'Ver el progreso en la página', btn_go_tab: 'Ir a la pestaña activa',
      hint_open_fab: 'Abre la página de Quixel Megascans gratis en esta pestaña.',
      hint_open_other: 'Abre fab.com en esta pestaña. Asegúrate de haber iniciado sesión allí.',
      warn_hidden: 'La pestaña de Fab está en segundo plano y el navegador la ralentiza. Vuelve a ella, o ábrela en su propia ventana, para ir a toda velocidad.',
      warn_unready: 'Esta página se abrió antes de que la extensión estuviera lista. Al empezar se recargará primero.',
      warn_permission: "Firefox necesita tu permiso para funcionar en fab.com.", btn_grant: "Permitir acceso a fab.com",
      intro: 'Añade uno a uno todos los Quixel Megascans gratuitos de Fab a tu biblioteca, usando el propio botón de Fab.',
      tips_title: 'Antes de empezar',
      tip1: 'Inicia sesión en <b>fab.com</b> con tu cuenta de Epic Games.',
      tip2: 'Más rápido: en Fab abre <b>User preferences</b>, desactiva <b>Show products in My Library</b> y guarda.',
      tip3: 'Mantén la pestaña de Fab abierta y visible. Una ejecución completa tarda unas horas; puedes pausar cuando quieras.',
      tip4: 'Solo añade elementos a tu biblioteca. Descárgalos después en Fab, Unreal Engine o Bridge.',
      reset: 'Empezar de nuevo', reset_confirm: '¿Olvidar el progreso en este equipo y empezar desde cero? Lo que ya está en tu biblioteca de Fab se queda allí.',
      copy_failed: 'Copiar elementos por reintentar', copied: '¡Copiado!',
      ov_added: 'Añadidos', ov_owned: 'Ya en la biblioteca', ov_failed: 'Por reintentar', ov_time: 'Tiempo',
      ov_hide: 'Ocultar', ov_hide_title: 'Oculta este panel. El proceso sigue en marcha.', ov_close: 'Cerrar',
      ov_close_confirm: '¿Pausar y cerrar el panel?', ov_run_again: 'Ejecutar de nuevo', ov_retry: 'Reintentar',
      ov_note: 'Mantén esta pestaña abierta y visible para mayor velocidad. Puedes ocultar el panel y seguir usando Fab en esta pestaña, pero no salgas de la página.',
      ov_chip: '{status} · {n} añadidos', ov_workspace: 'Espacio de trabajo de Fab',
      m_intro: 'Listo cuando tú lo estés.',
      m_starting: 'Iniciando…', m_opening: 'Abriendo el catálogo de Megascans…', m_loading_more: 'Cargando más elementos…',
      m_adding: 'Añadiendo: {title}', m_retry_in: 'Fab responde lento. Reintentando en {s} s…',
      m_slow_down: 'Fab pidió ir más despacio. Esperando {s} s…', m_pausing: 'Pausando…',
      m_paused_user: 'En pausa. Pulsa Reanudar para seguir donde lo dejaste.',
      m_done_all: '¡Listo! Todos los Megascans gratuitos están en tu biblioteca.',
      m_done_some: '¡Listo! {n} elemento(s) necesitan otro intento. Pulsa Reintentar.',
      m_tab_closed: 'Se cerró la pestaña de Fab. Abre la extensión y pulsa Reanudar.',
      m_interrupted: 'La ejecución se interrumpió (página recargada o navegador cerrado). Pulsa Reanudar.',
      e_address: 'Dirección inesperada. Detenido por seguridad.',
      e_catalog: 'El catálogo de Fab no cargó tras tres intentos. Revisa tu conexión y pulsa Reanudar.',
      e_filter: 'No se pudo confirmar el filtro Free en Fab. Recarga la página e inténtalo de nuevo.',
      e_results: 'Fab no mostró resultados. Pulsa Reanudar para intentarlo de nuevo.',
      e_load_more: 'Fab dejó de cargar resultados. Pulsa Reanudar para continuar desde aquí.',
      e_sign_in: 'Parece que no has iniciado sesión. Entra en Fab con tu cuenta de Epic Games y pulsa Empezar.',
      e_fail_streak: 'Varios elementos seguidos no se confirmaron. Puede que Fab esté saturado. Pulsa Reanudar en unos minutos.',
      e_rate_limit: 'Fab pidió varias veces ir más despacio. Descansa y pulsa Reanudar en aproximadamente una hora.',
      e_unknown: 'Ocurrió algo inesperado. Pulsa Reanudar para continuar.',
      n_finished: 'ScanHarvest terminó', n_paused: 'ScanHarvest en pausa', n_error: 'ScanHarvest requiere atención',
      n_body: 'Añadidos: {a} · Ya los tenías: {o}'
    },

    zh: {
      appName: 'ScanHarvest',
      tagline: '免费 Quixel Megascans，一键加入你的 Fab 资源库',
      language: '语言',
      status_idle: '就绪', status_running: '运行中', status_paused: '已暂停', status_finished: '已完成', status_error: '需要处理',
      stat_added: '项资源已添加', stat_owned: '已拥有', stat_failed: '待重试', stat_time: '用时', stat_eta: '剩余',
      btn_start: '开始领取', btn_resume: '继续', btn_pause: '暂停', btn_retry: '重试 {n} 项',
      btn_check_again: '再次检查新资源', btn_open_start: '打开 Fab Megascans 并开始', btn_open_resume: '打开 Fab Megascans 并继续',
      btn_show_progress: '在页面上显示进度', btn_go_tab: '前往正在运行的标签页',
      hint_open_fab: '在此标签页中打开免费 Quixel Megascans 页面。',
      hint_open_other: '在此标签页中打开 fab.com。请确认已在该网站登录。',
      warn_hidden: 'Fab 标签页在后台运行，浏览器会降低其速度。切换回该页，或将其放在单独窗口中，可保持全速。',
      warn_unready: '此页面在扩展就绪前已打开。开始时会先刷新页面。',
      warn_permission: "Firefox 需要你的授权才能在 fab.com 上运行。", btn_grant: "允许访问 fab.com",
      intro: '使用 Fab 自己的按钮，将 Fab 上所有免费的 Quixel Megascans 逐个加入你的资源库。',
      tips_title: '开始之前',
      tip1: '在 <b>fab.com</b> 使用 Epic Games 账户登录。',
      tip2: '更快的方法：在 Fab 打开 <b>User preferences</b>，关闭 <b>Show products in My Library</b> 并保存。',
      tip3: '保持 Fab 标签页打开且可见。完整运行需要几个小时，可随时暂停。',
      tip4: '本工具只会把资源加入资源库，之后可在 Fab、虚幻引擎或 Bridge 中下载。',
      reset: '重新开始', reset_confirm: '清除此电脑上的进度并从零开始计数？已在 Fab 资源库中的内容不会受影响。',
      copy_failed: '复制待重试项目', copied: '已复制！',
      ov_added: '本次添加', ov_owned: '已在资源库', ov_failed: '待重试', ov_time: '用时',
      ov_hide: '隐藏', ov_hide_title: '隐藏此面板，领取会继续进行。', ov_close: '关闭',
      ov_close_confirm: '暂停领取并关闭面板？', ov_run_again: '再次运行', ov_retry: '重试',
      ov_note: '保持此标签页打开且可见以获得最快速度。可以隐藏面板并在此标签页中继续浏览 Fab，但不要离开此页面。',
      ov_chip: '{status} · 已添加 {n} 项', ov_workspace: 'Fab 领取工作区',
      m_intro: '准备好了就开始吧。',
      m_starting: '正在启动…', m_opening: '正在打开 Megascans 目录…', m_loading_more: '正在加载更多资源…',
      m_adding: '正在添加：{title}', m_retry_in: 'Fab 响应较慢，{s} 秒后重试…',
      m_slow_down: 'Fab 要求放慢速度，等待 {s} 秒…', m_pausing: '正在暂停…',
      m_paused_user: '已暂停。点击“继续”从上次的位置接着领取。',
      m_done_all: '完成！所有免费 Megascans 都已在你的资源库中。',
      m_done_some: '完成！有 {n} 项需要重试，请点击“重试”。',
      m_tab_closed: 'Fab 标签页已关闭。请打开扩展并点击“继续”。',
      m_interrupted: '运行被中断（页面被刷新或浏览器已关闭）。点击“继续”以接着运行。',
      e_address: '地址异常，已为安全起见停止。',
      e_catalog: '尝试三次后仍无法加载 Fab 目录。请检查网络连接后点击“继续”。',
      e_filter: '无法确认 Fab 上的“免费”筛选条件。请刷新页面后重试。',
      e_results: 'Fab 没有显示任何结果。点击“继续”重试。',
      e_load_more: 'Fab 停止加载更多结果。点击“继续”从这里接着运行。',
      e_sign_in: '你似乎尚未登录。请使用 Epic Games 账户登录 Fab，然后点击“开始”。',
      e_fail_streak: '连续多项未能确认，Fab 可能较忙。请几分钟后点击“继续”。',
      e_rate_limit: 'Fab 多次要求放慢速度。请休息一下，约一小时后点击“继续”。',
      e_unknown: '发生了意外问题。点击“继续”以接着运行。',
      n_finished: 'ScanHarvest 已完成', n_paused: 'ScanHarvest 已暂停', n_error: 'ScanHarvest 需要处理',
      n_body: '已添加：{a} · 已拥有：{o}'
    }
  };

  const supported = code => Object.prototype.hasOwnProperty.call(STRINGS, code);
  function detect() {
    const code = (globalThis.navigator?.language || 'en').toLowerCase().slice(0, 2);
    return supported(code) ? code : 'en';
  }

  let current = detect();

  function t(key, params = {}) {
    const text = STRINGS[current]?.[key] ?? STRINGS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? ''));
  }

  /** Translate a stored message object: { k: key, p: params }. */
  const tm = msg => (msg && msg.k ? t(msg.k, msg.p || {}) : '');

  async function load() {
    try {
      const { lang } = await chrome.storage.local.get('lang');
      if (lang && supported(lang)) current = lang;
    } catch { /* storage unavailable: keep the browser language */ }
    return current;
  }

  function set(code) {
    if (!supported(code)) return Promise.resolve();
    current = code;
    return chrome.storage.local.set({ lang: code });
  }

  function onChange(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.lang) return;
      const next = changes.lang.newValue;
      current = next && supported(next) ? next : detect();
      callback(current);
    });
  }

  const info = (code = current) => LANGS.find(l => l.code === code) || LANGS[0];
  const locale = () => (current === 'zh' ? 'zh-CN' : current);
  const num = n => Number(n || 0).toLocaleString(locale());
  /** Elapsed/remaining time as h:mm:ss or m:ss, with the language's digits. */
  function duration(ms) {
    const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    const pad = v => String(v).padStart(2, '0');
    const text = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
    return text.replace(/\d/g, d => Number(d).toLocaleString(locale()));
  }

  return { LANGS, t, tm, load, set, onChange, info, num, duration, get lang() { return current; } };
})();
