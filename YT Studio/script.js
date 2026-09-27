const GOOGLE_CLIENT_ID =
  "1021869515911-rofhl76n807gjo6mpdhl4c5k3f7l120v.apps.googleusercontent.com";

const YOUTUBE_SCOPES =
  "https://www.googleapis.com/auth/youtube.readonly " +
  "https://www.googleapis.com/auth/yt-analytics.readonly";

const splash = document.getElementById("splash");
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const toast = document.getElementById("toast");

let googleTokenClient = null;
let googleAccessToken = null;
let connectedChannel = null;


/* =========================
   SETTINGS
========================= */

const defaultSettings = {
  theme: "dark",
  accent: "#ff3434",
  animations: true,
  splash: true,
  autosave: true,
  username: "Creator",
  defaultFormat: "Short YouTube",
  defaultStyle: "Viral",
  defaultNiche: ""
};

let settings = {
  ...defaultSettings,
  ...JSON.parse(
    localStorage.getItem("ytstudio-settings") || "{}"
  )
};

function saveSettings() {
  localStorage.setItem(
    "ytstudio-settings",
    JSON.stringify(settings)
  );
}

function applySettings() {

  let theme = settings.theme;

  if (theme === "system") {
    theme =
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }

  document.documentElement.setAttribute(
    "data-theme",
    theme
  );

  document.documentElement.style.setProperty(
    "--accent",
    settings.accent
  );

  const themeSetting =
    document.getElementById("themeSetting");

  const animationsSetting =
    document.getElementById("animationsSetting");

  const splashSetting =
    document.getElementById("splashSetting");

  const autosaveSetting =
    document.getElementById("autosaveSetting");

  const usernameSetting =
    document.getElementById("usernameSetting");

  const defaultFormat =
    document.getElementById("defaultFormat");

  const defaultStyle =
    document.getElementById("defaultStyle");

  const defaultNiche =
    document.getElementById("defaultNiche");

  if (themeSetting)
    themeSetting.value = settings.theme;

  if (animationsSetting)
    animationsSetting.checked = settings.animations;

  if (splashSetting)
    splashSetting.checked = settings.splash;

  if (autosaveSetting)
    autosaveSetting.checked = settings.autosave;

  if (usernameSetting)
    usernameSetting.value = settings.username;

  if (defaultFormat)
    defaultFormat.value = settings.defaultFormat;

  if (defaultStyle)
    defaultStyle.value = settings.defaultStyle;

  if (defaultNiche)
    defaultNiche.value = settings.defaultNiche;

  const format =
    document.getElementById("format");

  const ideaStyle =
    document.getElementById("ideaStyle");

  const niche =
    document.getElementById("niche");

  if (format)
    format.value = settings.defaultFormat;

  if (ideaStyle)
    ideaStyle.value = settings.defaultStyle;

  if (niche)
    niche.value = settings.defaultNiche;

  if (!connectedChannel) {

    const name =
      settings.username || "Creator";

    document.getElementById(
      "sidebarName"
    ).textContent = name;

    document.getElementById(
      "helloName"
    ).textContent = name;

    document.getElementById(
      "profileName"
    ).textContent = name;

    document.getElementById(
      "sidebarAvatar"
    ).textContent =
      name.charAt(0).toUpperCase();

    document.getElementById(
      "bigAvatar"
    ).textContent =
      name.charAt(0).toUpperCase();
  }

  document
    .querySelectorAll(".color-option")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.color === settings.accent
      );

    });
}

applySettings();


/* =========================
   SPLASH
========================= */

const loadingMessages = [
  "Initialisation...",
  "Chargement du studio...",
  "Préparation de l'IA...",
  "YT Studio AI est prêt."
];

let loadingIndex = 0;

const loadingInterval =
  setInterval(() => {

    loadingIndex++;

    if (
      loadingIndex <
      loadingMessages.length
    ) {

      const loadingText =
        document.getElementById("loadingText");

      if (loadingText) {
        loadingText.textContent =
          loadingMessages[loadingIndex];
      }
    }

  }, 400);


function finishSplash() {

  clearInterval(
    loadingInterval
  );

  if (splash) {
    splash.style.display =
      "none";
  }

  if (loginScreen) {
    loginScreen.style.display =
      "flex";
  }
}


if (settings.splash) {

  setTimeout(
    finishSplash,
    1700
  );

} else {

  finishSplash();
}


/* =========================
   TOAST
========================= */

function showToast(message) {

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3000);
}


/* =========================
   NAVIGATION
========================= */

function openPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove(
        "active-page"
      );

    });

  const target =
    document.getElementById(
      pageName
    );

  if (target) {
    target.classList.add(
      "active-page"
    );
  }

  document
    .querySelectorAll(".nav")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );

    });
}


document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        openPage(
          button.dataset.page
        );

      }
    );

  });


document
  .querySelectorAll("[data-open]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        openPage(
          button.dataset.open
        );

      }
    );

  });


/* =========================
   GOOGLE / YOUTUBE LOGIN
========================= */

function initializeGoogle() {

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.oauth2
  ) {
    return false;
  }

  googleTokenClient =
    google.accounts.oauth2.initTokenClient({

      client_id:
        GOOGLE_CLIENT_ID,

      scope:
        YOUTUBE_SCOPES,

      callback:
        handleGoogleToken

    });

  return true;
}


async function handleGoogleToken(response) {

  if (
    !response ||
    response.error
  ) {

    console.error(
      response
    );

    showToast(
      "❌ Connexion Google refusée"
    );

    return;
  }

  googleAccessToken =
    response.access_token;

  showToast(
    "✓ Google connecté"
  );

  await loadYouTubeChannel();

  if (connectedChannel) {

    loginScreen.style.display =
      "none";

    app.style.display =
      "flex";
  }
}


function requestGoogleAccess() {

  if (!googleTokenClient) {

    const ready =
      initializeGoogle();

    if (!ready) {

      showToast(
        "Google est encore en chargement..."
      );

      setTimeout(
        requestGoogleAccess,
        800
      );

      return;
    }
  }

  googleTokenClient.requestAccessToken({
    prompt: "consent"
  });
}


const googleLogin =
  document.getElementById(
    "googleLogin"
  );

if (googleLogin) {

  googleLogin.addEventListener(
    "click",
    requestGoogleAccess
  );

}


document
  .querySelectorAll(".connect-youtube")
  .forEach(button => {

    button.addEventListener(
      "click",
      requestGoogleAccess
    );

  });


/* =========================
   LOAD YOUTUBE CHANNEL
========================= */

async function loadYouTubeChannel() {

  if (!googleAccessToken) {
    return;
  }

  try {

    const response =
      await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        {
          headers: {
            Authorization:
              `Bearer ${googleAccessToken}`
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        data
      );

      showToast(
        "❌ " +
        (
          data?.error?.message ||
          "Erreur YouTube"
        )
      );

      return;
    }

    if (
      !data.items ||
      data.items.length === 0
    ) {

      showToast(
        "⚠️ Aucune chaîne YouTube trouvée"
      );

      return;
    }

    connectedChannel =
      data.items[0];

    updateChannelUI(
      connectedChannel
    );

    await loadRecentVideos();

    showToast(
      `▶ ${connectedChannel.snippet.title} connectée`
    );

  }

  catch (error) {

    console.error(
      error
    );

    showToast(
      "❌ Impossible de contacter YouTube"
    );
  }
}


/* =========================
   CHANNEL UI
========================= */

function updateChannelUI(channel) {

  const snippet =
    channel.snippet || {};

  const stats =
    channel.statistics || {};

  const channelName =
    snippet.title ||
    "Chaîne YouTube";

  const channelImage =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url;

  const subscribers =
    stats.hiddenSubscriberCount
      ? "Masqué"
      : formatNumber(
          stats.subscriberCount
        );

  const views =
    formatNumber(
      stats.viewCount
    );

  const videos =
    formatNumber(
      stats.videoCount
    );

  setText(
    "sidebarName",
    channelName
  );

  setText(
    "helloName",
    channelName
  );

  setText(
    "profileName",
    channelName
  );

  setText(
    "profileEmail",
    "Chaîne YouTube connectée"
  );

  setText(
    "accountStatus",
    "● Connecté"
  );

  setText(
    "dashboardChannelName",
    channelName
  );

  setText(
    "dashboardChannelStatus",
    "Chaîne YouTube connectée ✓"
  );

  setText(
    "accountYoutubeStatus",
    `${channelName} est connectée.`
  );

  setText(
    "settingsYoutubeStatus",
    `${channelName} est connectée.`
  );

  setText(
    "analyticsMessage",
    "✓ Données YouTube chargées."
  );

  setText(
    "dashboardSubscribers",
    subscribers
  );

  setText(
    "dashboardViews",
    views
  );

  setText(
    "dashboardVideos",
    videos
  );

  setText(
    "analyticsSubscribers",
    subscribers
  );

  setText(
    "analyticsViews",
    views
  );

  setText(
    "analyticsVideos",
    videos
  );

  document
    .querySelectorAll(
      ".connect-youtube"
    )
    .forEach(button => {

      button.textContent =
        "✓ YouTube connecté";

    });

  if (channelImage) {

    const imageHTML =
      `<img src="${channelImage}" alt="Logo YouTube">`;

    const sidebarAvatar =
      document.getElementById(
        "sidebarAvatar"
      );

    const bigAvatar =
      document.getElementById(
        "bigAvatar"
      );

    const dashboardAvatar =
      document.getElementById(
        "dashboardChannelAvatar"
      );

    if (sidebarAvatar)
      sidebarAvatar.innerHTML =
        imageHTML;

    if (bigAvatar)
      bigAvatar.innerHTML =
        imageHTML;

    if (dashboardAvatar)
      dashboardAvatar.innerHTML =
        imageHTML;
  }
}


/* =========================
   VIDEOS
========================= */

async function loadRecentVideos() {

  if (
    !googleAccessToken ||
    !connectedChannel
  ) return;

  try {

    const channelId =
      connectedChannel.id;

    const response =
      await fetch(
        "https://www.googleapis.com/youtube/v3/search" +
        "?part=snippet" +
        "&type=video" +
        "&order=date" +
        "&maxResults=10" +
        `&channelId=${encodeURIComponent(channelId)}`,
        {
          headers: {
            Authorization:
              `Bearer ${googleAccessToken}`
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        data
      );

      return;
    }

    renderVideos(
      data.items || []
    );

  }

  catch (error) {

    console.error(
      error
    );
  }
}


function renderVideos(videos) {

  const container =
    document.getElementById(
      "videosState"
    );

  if (!container)
    return;

  if (!videos.length) {

    container.innerHTML =
      `
      <div>🎬</div>
      <h3>Aucune vidéo trouvée</h3>
      <p>
        Cette chaîne n'a aucune vidéo publique récente.
      </p>
      `;

    return;
  }

  container.className =
    "video-list";

  container.innerHTML =
    videos.map(video => {

      const snippet =
        video.snippet || {};

      const image =
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        "";

      return `
        <div class="project-item">

          <div style="
            display:flex;
            align-items:center;
            gap:15px;
          ">

            ${
              image
                ? `
                <img
                  src="${image}"
                  alt=""
                  style="
                    width:120px;
                    height:68px;
                    object-fit:cover;
                    border-radius:10px;
                  "
                >
                `
                : ""
            }

            <div>

              <strong>
                ${escapeHTML(snippet.title || "")}
              </strong>

              <br>

              <small>
                ${formatDate(snippet.publishedAt)}
              </small>

            </div>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================
   GROQ AI
========================= */

async function askAI(prompt) {

  const response =
    await fetch(
      "/.netlify/functions/generate-ai",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          prompt
        })
      }
    );

  let data;

  try {

    data =
      await response.json();

  }

  catch {

    throw new Error(
      "Le serveur IA n'a pas renvoyé une réponse valide."
    );
  }

  if (!response.ok) {

    throw new Error(
      data.error ||
      "Erreur du générateur IA"
    );
  }

  return data.result;
}


/* =========================
   IDEAS AI
========================= */

const generateIdeas =
  document.getElementById(
    "generateIdeas"
  );

if (generateIdeas) {

  generateIdeas.addEventListener(
    "click",
    async () => {

      const niche =
        document
          .getElementById("niche")
          .value
          .trim();

      const format =
        document
          .getElementById("format")
          .value;

      const style =
        document
          .getElementById("ideaStyle")
          .value;

      const output =
        document.getElementById(
          "ideasOutput"
        );

      if (!niche) {

        showToast(
          "Entre une niche"
        );

        return;
      }

      generateIdeas.disabled =
        true;

      generateIdeas.textContent =
        "✦ Génération...";

      output.textContent =
        "🤖 L'IA cherche les meilleures idées...";

      try {

        const result =
          await askAI(`
Tu dois générer 10 idées de vidéos YouTube.

NICHE :
${niche}

FORMAT :
${format}

STYLE :
${style}

Pour chacune des 10 idées, donne :

1. Le concept
2. Un hook puissant
3. Un titre YouTube
4. Le déroulement rapide de la vidéo
5. Pourquoi le concept peut attirer l'attention

Les idées doivent être différentes les unes des autres.

Évite les titres mensongers.

Réponds directement avec les idées.
          `);

        output.textContent =
          result;

      }

      catch (error) {

        console.error(
          error
        );

        output.textContent =
          "❌ " + error.message;
      }

      finally {

        generateIdeas.disabled =
          false;

        generateIdeas.textContent =
          "✦ Générer les idées";
      }
    }
  );
}


/* =========================
   SCRIPT AI
========================= */

const generateScript =
  document.getElementById(
    "generateScript"
  );

if (generateScript) {

  generateScript.addEventListener(
    "click",
    async () => {

      const idea =
        document
          .getElementById(
            "scriptIdea"
          )
          .value
          .trim();

      const duration =
        document
          .getElementById(
            "duration"
          )
          .value;

      const output =
        document.getElementById(
          "scriptOutput"
        );

      if (!idea) {

        showToast(
          "Entre ton idée"
        );

        return;
      }

      generateScript.disabled =
        true;

      generateScript.textContent =
        "🎬 Écriture...";

      output.textContent =
        "🤖 L'IA écrit ton script...";

      try {

        const result =
          await askAI(`
Écris un script YouTube complet.

IDÉE :
${idea}

DURÉE CIBLE :
${duration}

Structure le résultat avec :

HOOK
Un hook extrêmement rapide.

SCÈNE 1
- voix off
- visuel
- montage

SCÈNE 2
- voix off
- visuel
- montage

Continue autant que nécessaire pour respecter la durée.

CLIMAX
Le moment le plus important.

FIN
Une fin efficace.

CTA
Un CTA naturel uniquement si pertinent.

Le script doit pouvoir être directement utilisé pour monter la vidéo.
          `);

        output.textContent =
          result;

      }

      catch (error) {

        console.error(
          error
        );

        output.textContent =
          "❌ " + error.message;
      }

      finally {

        generateScript.disabled =
          false;

        generateScript.textContent =
          "🎬 Générer le script";
      }
    }
  );
}


/* =========================
   EDIT AI
========================= */

const generateEdit =
  document.getElementById(
    "generateEdit"
  );

if (generateEdit) {

  generateEdit.addEventListener(
    "click",
    async () => {

      const subject =
        document
          .getElementById(
            "editSubject"
          )
          .value
          .trim();

      const output =
        document.getElementById(
          "editOutput"
        );

      if (!subject) {

        showToast(
          "Entre un sujet"
        );

        return;
      }

      generateEdit.disabled =
        true;

      generateEdit.textContent =
        "✂️ Création...";

      output.textContent =
        "🤖 L'IA prépare ton montage...";

      try {

        const result =
          await askAI(`
Crée un plan de montage vidéo professionnel.

SUJET :
${subject}

Je veux un plan directement utilisable dans CapCut ou un logiciel de montage.

Donne :

- hook
- durée recommandée
- timeline
- clips à utiliser
- cuts
- zooms
- transitions
- effets visuels
- sound effects
- rythme de la musique
- climax
- fin
- idée de loop si le format est court

Évite de mettre une transition différente à chaque cut.

Le montage doit être dynamique et cohérent.
          `);

        output.textContent =
          result;

      }

      catch (error) {

        console.error(
          error
        );

        output.textContent =
          "❌ " + error.message;
      }

      finally {

        generateEdit.disabled =
          false;

        generateEdit.textContent =
          "✂️ Générer le montage";
      }
    }
  );
}


/* =========================
   THUMBNAIL AI
========================= */

const generateThumbnail =
  document.getElementById(
    "generateThumbnail"
  );

if (generateThumbnail) {

  generateThumbnail.addEventListener(
    "click",
    async () => {

      const subject =
        document
          .getElementById(
            "thumbnailSubject"
          )
          .value
          .trim();

      const output =
        document.getElementById(
          "thumbnailOutput"
        );

      if (!subject) {

        showToast(
          "Entre un sujet"
        );

        return;
      }

      generateThumbnail.disabled =
        true;

      generateThumbnail.textContent =
        "🖼️ Création...";

      output.textContent =
        "🤖 L'IA imagine ta miniature...";

      try {

        const result =
          await askAI(`
Tu es expert en miniatures YouTube.

SUJET DE LA VIDÉO :
${subject}

Crée 3 concepts de miniatures.

Pour chaque concept donne :

- composition
- sujet principal
- arrière-plan
- expression/action
- couleurs recommandées
- texte éventuel, maximum 4 mots
- élément qui crée de la curiosité

La miniature doit rester lisible sur téléphone.

Ne génère pas l'image.
Décris précisément le concept.
          `);

        output.textContent =
          result;

      }

      catch (error) {

        console.error(
          error
        );

        output.textContent =
          "❌ " + error.message;
      }

      finally {

        generateThumbnail.disabled =
          false;

        generateThumbnail.textContent =
          "🖼️ Créer le concept";
      }
    }
  );
}


/* =========================
   PROJECTS
========================= */

let projects =
  JSON.parse(
    localStorage.getItem(
      "ytstudio-projects"
    ) || "[]"
  );


function saveProjects() {

  if (!settings.autosave)
    return;

  localStorage.setItem(
    "ytstudio-projects",
    JSON.stringify(projects)
  );
}


function renderProjects() {

  const list =
    document.getElementById(
      "projectList"
    );

  if (!list)
    return;

  if (!projects.length) {

    list.innerHTML =
      `
      <div class="large-card">
        <div class="empty-state">

          <div>📁</div>

          <h3>
            Aucun projet
          </h3>

          <p>
            Crée ton premier projet.
          </p>

        </div>
      </div>
      `;

    return;
  }

  list.innerHTML =
    projects.map(
      (project,index) => `
        <div class="project-item">

          <div>

            <strong>
              ${escapeHTML(project.name)}
            </strong>

            <br>

            <small>
              ${escapeHTML(project.date)}
            </small>

          </div>

          <button
            class="delete-project"
            data-index="${index}"
          >
            Supprimer
          </button>

        </div>
      `
    ).join("");

  document
    .querySelectorAll(
      ".delete-project"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          projects.splice(
            Number(
              button.dataset.index
            ),
            1
          );

          saveProjects();
          renderProjects();
        }
      );

    });
}


const createProjectButton =
  document.getElementById(
    "createProject"
  );

if (createProjectButton) {

  createProjectButton.addEventListener(
    "click",
    () => {

      const name =
        prompt(
          "Nom du projet :"
        );

      if (!name)
        return;

      projects.unshift({
        name,
        date:
          new Date()
            .toLocaleDateString(
              "fr-FR"
            )
      });

      saveProjects();
      renderProjects();

      showToast(
        "✓ Projet créé"
      );
    }
  );
}

renderProjects();


/* =========================
   SETTINGS EVENTS
========================= */

function listen(
  id,
  event,
  callback
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.addEventListener(
      event,
      callback
    );
  }
}


listen(
  "themeSetting",
  "change",
  event => {

    settings.theme =
      event.target.value;

    saveSettings();
    applySettings();
  }
);


listen(
  "animationsSetting",
  "change",
  event => {

    settings.animations =
      event.target.checked;

    saveSettings();
  }
);


listen(
  "splashSetting",
  "change",
  event => {

    settings.splash =
      event.target.checked;

    saveSettings();
  }
);


listen(
  "autosaveSetting",
  "change",
  event => {

    settings.autosave =
      event.target.checked;

    saveSettings();
  }
);


listen(
  "usernameSetting",
  "input",
  event => {

    settings.username =
      event.target.value ||
      "Creator";

    saveSettings();
    applySettings();
  }
);


listen(
  "defaultFormat",
  "change",
  event => {

    settings.defaultFormat =
      event.target.value;

    saveSettings();
  }
);


listen(
  "defaultStyle",
  "change",
  event => {

    settings.defaultStyle =
      event.target.value;

    saveSettings();
  }
);


listen(
  "defaultNiche",
  "input",
  event => {

    settings.defaultNiche =
      event.target.value;

    saveSettings();
  }
);


document
  .querySelectorAll(
    ".color-option"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        settings.accent =
          button.dataset.color;

        saveSettings();
        applySettings();
      }
    );

  });


/* =========================
   RESET PROJECTS
========================= */

listen(
  "resetProjects",
  "click",
  () => {

    if (
      !confirm(
        "Supprimer tous les projets ?"
      )
    ) return;

    projects = [];

    localStorage.removeItem(
      "ytstudio-projects"
    );

    renderProjects();

    showToast(
      "Projets supprimés"
    );
  }
);


/* =========================
   DELETE LOCAL DATA
========================= */

listen(
  "deleteLocalData",
  "click",
  () => {

    if (
      !confirm(
        "Supprimer toutes les données locales ?"
      )
    ) return;

    localStorage.removeItem(
      "ytstudio-settings"
    );

    localStorage.removeItem(
      "ytstudio-projects"
    );

    location.reload();
  }
);


/* =========================
   LOGOUT
========================= */

function logout() {

  if (
    googleAccessToken &&
    window.google
  ) {

    google.accounts.oauth2.revoke(
      googleAccessToken,
      () => {}
    );
  }

  googleAccessToken =
    null;

  connectedChannel =
    null;

  app.style.display =
    "none";

  loginScreen.style.display =
    "flex";

  resetYouTubeUI();

  showToast(
    "Déconnecté"
  );
}


listen(
  "accountLogout",
  "click",
  logout
);


document
  .querySelectorAll(
    ".logout-action"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      logout
    );

  });


function resetYouTubeUI() {

  setText(
    "dashboardSubscribers",
    "—"
  );

  setText(
    "dashboardViews",
    "—"
  );

  setText(
    "dashboardVideos",
    "—"
  );

  setText(
    "analyticsSubscribers",
    "—"
  );

  setText(
    "analyticsViews",
    "—"
  );

  setText(
    "analyticsVideos",
    "—"
  );

  setText(
    "dashboardChannelName",
    "YouTube non connecté"
  );

  setText(
    "dashboardChannelStatus",
    "Connecte ta chaîne pour afficher tes données"
  );

  setText(
    "dashboardChannelAvatar",
    "▶"
  );

  setText(
    "profileEmail",
    "Google / YouTube non connecté"
  );

  setText(
    "accountStatus",
    "● Hors ligne"
  );

  setText(
    "accountYoutubeStatus",
    "Aucune chaîne connectée."
  );

  setText(
    "settingsYoutubeStatus",
    "YouTube non connecté."
  );

  document
    .querySelectorAll(
      ".connect-youtube"
    )
    .forEach(button => {

      button.textContent =
        "▶ Connecter YouTube";

    });

  applySettings();
}


/* =========================
   UTILITIES
========================= */

function setText(
  id,
  text
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      text;
  }
}


function formatNumber(number) {

  if (
    number === undefined ||
    number === null
  ) {
    return "—";
  }

  const value =
    Number(number);

  if (
    Number.isNaN(value)
  ) {
    return number;
  }

  return new Intl.NumberFormat(
    "fr-FR",
    {
      notation: "compact",
      maximumFractionDigits: 1
    }
  ).format(value);
}


function formatDate(date) {

  if (!date)
    return "";

  return new Date(
    date
  ).toLocaleDateString(
    "fr-FR"
  );
}


function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================
   SYSTEM THEME
========================= */

window
  .matchMedia(
    "(prefers-color-scheme: dark)"
  )
  .addEventListener(
    "change",
    () => {

      if (
        settings.theme ===
        "system"
      ) {

        applySettings();
      }
    }
  );