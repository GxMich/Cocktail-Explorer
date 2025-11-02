// Riferimenti agli elementi del DOM
const btnSearch = document.getElementById('search');              // Bottone "Cerca"
const searchText = document.getElementById('search-text');        // Campo input per il testo di ricerca
const suggestionsList = document.getElementById('ingredient-suggestions'); // Lista dei suggerimenti
let allIngredients = []; // Array globale che conterrà tutti gli ingredienti
let allCocktails = [];   // Array globale che conterrà tutti i nomi dei cocktail

/**
 * Funzione asincrona che recupera TUTTI i cocktail (a–z e 0–9)
 * e l'elenco completo degli ingredienti dal database TheCocktailDB.
 */
const searchAllIngredients = async () => {
    // Array di caratteri da 0–9 e a–z per interrogare l'API per ogni lettera/numero
    const chars = [
        ...Array.from({ length: 10 }, (_, i) => i.toString()), // ["0","1",...,"9"]
        ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)) // ["a","b",...,"z"]
    ];

    let risposta;
    let json;

    // Ciclo su ogni carattere per ottenere i cocktail corrispondenti
    for (const char of chars) {
        risposta = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${char}`);
        json = await risposta.json();

        // Se ci sono risultati, aggiungo solo i nomi dei cocktail (non gli oggetti completi)
        if (json.drinks) {
            allCocktails.push(...json.drinks.map(c => c.strDrink));
            console.log(...json.drinks.map(c => c.strDrink)); // Debug: mostra i nomi ottenuti
        }
    }

    console.log('✅ Caricamento cocktail completato.');

    // Recupero l'elenco completo degli ingredienti
    risposta = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list');
    json = await risposta.json();

    // Aggiungo i nomi degli ingredienti all’array globale
    json.drinks.forEach(i => allIngredients.push(i.strIngredient1));

    console.log('✅ Caricamento ingredienti completato.');
};


/**
 * Funzione che genera i suggerimenti dinamici
 * in base al testo inserito dall’utente nell’input.
 */
const suggestions = () => {
    const query = searchText.value.toLowerCase().trim(); // Testo digitato, normalizzato
    suggestionsList.innerHTML = ''; // Pulisco la lista precedente

    if (!query) return; // Se l’input è vuoto, interrompo la funzione

    // Filtra gli ingredienti (massimo 5 risultati)
    const filteredIngredients = allIngredients
        .map(i => i.toLowerCase())
        .filter(i => i.includes(query))
        .slice(0, 5);

    // Filtra i cocktail (massimo 5 risultati)
    const filteredCocktails = allCocktails
        .map(c => c.toLowerCase())
        .filter(c => c.includes(query))
        .slice(0, 5);

    // Combina i risultati in un unico array con il tipo (cocktail / ingrediente)
    const combined = [
        ...filteredCocktails.map(c => ({ name: c, type: 'cocktail' })),
        ...filteredIngredients.map(i => ({ name: i, type: 'ingredient' }))
    ];

    // Per ogni suggerimento trovato, creo un <li> nella lista
    combined.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.dataset.type = item.type; // Serve per applicare stile differente nel CSS
        suggestionsList.appendChild(li);

        // Quando l’utente clicca su un suggerimento, lo inserisco nell’input
        li.addEventListener('click', () => {
            searchText.value = item.name;
            suggestionsList.innerHTML = ''; // Nasconde la lista dopo la selezione
        });
    });
};

// Eseguo il caricamento iniziale dei dati (cocktail + ingredienti)
searchAllIngredients();

// Attivo i suggerimenti dinamici durante la digitazione
searchText.addEventListener('input', suggestions);
