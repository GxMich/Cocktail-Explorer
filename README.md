🍸 Cocktail-Explorer

Un progetto web che permette di cercare cocktail e ingredienti usando l’API gratuita di TheCocktailDB.
L’app mostra cocktail casuali all’avvio, permette di fare ricerche per nome o per ingrediente, e include un sistema di suggerimenti dinamici mentre si digita nella barra di ricerca.


🚀 Funzionalità principali

- Ricerca cocktail o ingredienti  
  Inserendo il nome di un cocktail o di un ingrediente, vengono mostrati i risultati corrispondenti.  
  Il sistema capisce se si tratta di un nome cocktail o di un ingrediente e fa la chiamata API corretta.

- Suggerimenti in tempo reale  
  Mentre scrivi, compaiono fino a 10 suggerimenti tra cocktail e ingredienti.  
  Cliccando su un suggerimento la ricerca parte automaticamente.

- Cocktail casuali all’avvio  
  Quando la pagina si apre, vengono mostrati 9 cocktail casuali.  
  Ogni card ha un effetto di comparsa graduale e mostra gli ingredienti principali.

- Dettaglio ricetta  
  Cliccando sul bottone “Ricetta” si apre una scheda con:  
  Ingredienti e quantità, istruzioni di preparazione e immagine di sfondo con effetto parallax.  
  È possibile tornare alla lista cliccando su “Torna ai cocktail”.

- Caricamento ottimizzato  
  Tutti gli ingredienti e i cocktail vengono caricati in background all’avvio, così i suggerimenti sono più veloci.  
  Uso di placeholder shimmer per indicare il caricamento.

🧩 Tecnologie utilizzate

HTML5 – struttura dell’app  
CSS3 – stili, animazioni e shimmer  
JavaScript (vanilla) – logica principale  
Fetch API – per comunicare con TheCocktailDB  
TheCocktailDB API – fonte dei dati (cocktail, ingredienti, ricette)


⚙️ Come eseguirlo

1. Clona la repository:
    bash
    git clone https://github.com/tuo-username/nome-repo.git

2. Apri il progetto:

    cd nome-repo

3. Apri il file index.html nel browser (oppure usa Live Server su VS Code).

4. Attendi il caricamento iniziale dei cocktail random, poi prova a cercare un cocktail o un ingrediente.


🧠 Cose che ho imparato

Durante lo sviluppo di questo progetto ho imparato a:
  Lavorare con le API REST usando fetch e async/await
  Gestire più chiamate API in parallelo con Promise.all
  Migliorare le performance caricando i dati in background
  Aggiungere effetti visivi con CSS e JavaScript
  Gestire eventi e DOM in modo più pulito
  
🔮 Miglioramenti futuri
  Aggiungere un sistema di preferiti salvato nel browser
  Migliorare il design con una UI più moderna
  Implementare un filtro per categoria (Alcoholic / Non-Alcoholic)
  Rendere il sito completamente responsive

📜 Crediti

API: TheCocktailDB
Sviluppato da Michele Modica come progetto personale per esercitarmi con JavaScript e API REST.
