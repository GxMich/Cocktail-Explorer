// ===============================
// 🎯 SEZIONE VARIABILI E RIFERIMENTI
// ===============================

// Prendo gli elementi principali dal DOM
const btnSearch = document.getElementById('search');               // Bottone per avviare la ricerca
const searchText = document.getElementById('search-text');         // Input di testo per scrivere cosa cercare
const suggestionsList = document.getElementById('ingredient-suggestions'); // Lista dove mostro i suggerimenti

// Array dove salvo tutti gli ingredienti e cocktail
let allIngredients = [];
let allCocktails = [];

/**
 * Funzione asincrona che scarica tutti i cocktail (A–Z e 0–9)
 * e la lista completa degli ingredienti dal database TheCocktailDB
 */
const searchAllIngredients = async () => {
    // Creo un array di lettere e numeri da passare all’API
    const chars = [
        ...Array.from({ length: 10 }, (_, i) => i.toString()), // ["0", "1", ..., "9"]
        ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)) // ["a", "b", ..., "z"]
    ];

    let risposta;
    let json;

    // Faccio una chiamata per ogni lettera/numero per prendere tutti i cocktail
    for (const char of chars) {
        risposta = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${char}`);
        json = await risposta.json();

        // Se ci sono risultati, prendo solo i nomi dei cocktail
        if (json.drinks) {
            allCocktails.push(...json.drinks.map(c => c.strDrink));
            console.log(...json.drinks.map(c => c.strDrink)); // Controllo in console cosa arriva
        }
    }

    console.log('✅ Tutti i cocktail caricati!');

    // Ora chiamo l’API per avere la lista di tutti gli ingredienti
    risposta = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list');
    json = await risposta.json();

    // Aggiungo gli ingredienti nell’array globale
    json.drinks.forEach(i => allIngredients.push(i.strIngredient1));

    console.log('✅ Tutti gli ingredienti caricati!');
};


/**
 * Funzione che mostra i suggerimenti mentre l’utente scrive
 */
const suggestions = () => {
    const query = searchText.value.toLowerCase().trim(); // Prendo il testo dell’input e lo metto in minuscolo
    suggestionsList.innerHTML = ''; // Svuoto la lista ogni volta prima di aggiungere nuovi risultati

    // Se l’input è vuoto, non faccio nulla
    if (!query) return;

    // Filtro gli ingredienti (massimo 5 risultati)
    const filteredIngredients = allIngredients
        .map(i => i.toLowerCase())
        .filter(i => i.includes(query))
        .slice(0, 5);

    // Filtro i cocktail (massimo 5 risultati)
    const filteredCocktails = allCocktails
        .map(c => c.toLowerCase())
        .filter(c => c.includes(query))
        .slice(0, 5);

    // Metto insieme i risultati, indicando se è un cocktail o un ingrediente
    const combined = [
        ...filteredCocktails.map(c => ({ name: c, type: 'cocktail' })),
        ...filteredIngredients.map(i => ({ name: i, type: 'ingredient' }))
    ];

    // Creo un elemento <li> per ogni suggerimento trovato
    combined.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.dataset.type = item.type; // Serve per lo stile nel CSS
        suggestionsList.appendChild(li);

        // Quando clicco su un suggerimento, lo scrive nell’input e chiude la lista
        li.addEventListener('click', () => {
            searchText.value = item.name;
            suggestionsList.innerHTML = '';
        });
    });
};

// Faccio partire subito il caricamento dei dati
searchAllIngredients();

// Ogni volta che scrivo nell’input, aggiorno i suggerimenti
searchText.addEventListener('input', suggestions);


/**
 * Funzione che mostra 9 cocktail casuali con effetto shimmer di caricamento
 */
const mostraRandomCocktail = async () => {
    const contenitore = document.getElementById('container-cocktail');
    contenitore.innerHTML = '';

    const cocktailSet = new Set();

    // Prima mostro 9 placeholder con effetto shimmer (loading)
    for (let i = 0; i < 9; i++) {
        const placeholder = document.createElement('div');
        placeholder.classList.add('card-cocktail', 'loading');
        placeholder.innerHTML = `
            <div class="img-placeholder"></div>
            <div class="title-placeholder"></div>
            <div class="tags-placeholder"></div>
        `;
        contenitore.appendChild(placeholder);
    }

    // Poi chiamo l’API 9 volte per ottenere cocktail casuali
    while (cocktailSet.size < 9) {
        const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const json = await response.json();
        cocktailSet.add(json.drinks[0]); // Aggiungo solo l’oggetto cocktail
    }

    // Una volta pronti, sostituisco i placeholder con i dati reali
    Array.from(contenitore.children).forEach((card, index) => {
        const cocktail = Array.from(cocktailSet)[index];
        card.classList.remove('loading');

        // Creo la lista degli ingredienti
        let ingredientiHTML = '';
        for (let i = 1; i <= 15; i++) {
            const ingrediente = cocktail[`strIngredient${i}`];
            if (ingrediente) {
                ingredientiHTML += `<p class="tag">${ingrediente}</p>`;
            }
        }

        // Riempio la card con i dati veri del cocktail
        card.innerHTML = `
            <img class="img-cocktail" src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}">
            <h2 class="title-cocktail">${cocktail.strDrink}</h2>
            <div class="tag-ingredienti-cocktail">
                ${ingredientiHTML}
            </div>
            <button class="btn-view-ricetta" data-id="${cocktail.idDrink}">Ricetta</button>
        `;

        // Aggiungo un effetto di comparsa (fade-in) per ogni card
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, index * 100); // piccolo ritardo tra le card per effetto graduale
    });
};

// Quando la pagina è pronta, mostro subito 9 cocktail casuali
window.addEventListener('DOMContentLoaded', mostraRandomCocktail);
