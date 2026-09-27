exports.handler = async function(event) {

  if (event.httpMethod !== "POST") {

    return {
      statusCode: 405,

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        error:
          "Méthode non autorisée."
      })
    };
  }


  try {

    const apiKey =
      process.env.GROQ_API_KEY;


    if (!apiKey) {

      return {
        statusCode: 500,

        body: JSON.stringify({
          error:
            "La clé GROQ_API_KEY n'est pas configurée sur Netlify."
        })
      };
    }


    let requestBody;


    try {

      requestBody =
        JSON.parse(
          event.body || "{}"
        );

    }

    catch {

      return {
        statusCode: 400,

        body: JSON.stringify({
          error:
            "Requête invalide."
        })
      };
    }


    const prompt =
      String(
        requestBody.prompt || ""
      ).trim();


    if (!prompt) {

      return {
        statusCode: 400,

        body: JSON.stringify({
          error:
            "Le prompt est vide."
        })
      };
    }


    if (
      prompt.length >
      12000
    ) {

      return {
        statusCode: 400,

        body: JSON.stringify({
          error:
            "Le prompt est trop long."
        })
      };
    }


    const groqResponse =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`

          },


          body: JSON.stringify({

            model:
              "llama-3.3-70b-versatile",

            messages: [

              {
                role:
                  "system",

                content:
`Tu es YT Studio AI, un assistant professionnel spécialisé dans la création de contenu YouTube.

Tu aides les créateurs avec :

- idées de vidéos
- YouTube Shorts
- vidéos longues
- storytelling
- hooks
- scripts
- titres
- descriptions
- plans de montage
- rétention
- miniatures
- stratégie de contenu

Règles :

1. Réponds dans la langue de l'utilisateur.
2. Donne des résultats concrets et directement utilisables.
3. Évite les longues introductions inutiles.
4. N'invente pas de statistiques YouTube réelles.
5. Lorsqu'une donnée actuelle est inconnue, dis-le clairement.
6. Structure proprement les résultats.
7. Pour les Shorts, privilégie un hook immédiat et un rythme rapide.
8. Pour les vidéos longues, privilégie storytelling et rétention.`
              },

              {
                role:
                  "user",

                content:
                  prompt
              }

            ],

            temperature:
              0.8,

            max_completion_tokens:
              2000

          })
        }
      );


    const data =
      await groqResponse.json();


    if (
      !groqResponse.ok
    ) {

      console.error(
        "Groq API error:",
        data
      );


      return {
        statusCode:
          groqResponse.status,

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          error:
            data?.error?.message ||
            "Groq a refusé la requête."

        })
      };
    }


    const result =
      data?.choices?.[0]
        ?.message
        ?.content;


    if (!result) {

      return {
        statusCode: 500,

        body: JSON.stringify({
          error:
            "Groq n'a retourné aucun texte."
        })
      };
    }


    return {

      statusCode: 200,

      headers: {

        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store"

      },

      body: JSON.stringify({
        result
      })
    };

  }

  catch (error) {

    console.error(
      "YT Studio AI function error:",
      error
    );


    return {

      statusCode: 500,

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({

        error:
          "Erreur interne du serveur IA."

      })
    };
  }
};