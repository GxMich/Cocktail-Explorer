const btnSearch = document.getElementById('search');
const searchText = document.getElementById('search-text');
const suggestionsList = document.getElementById('ingredient-suggestions');

let filteredIngredients = [];
let filteredCocktails = [];
let allCocktails = [];
let allIngredients = [];

/* ============================================================
   Funzione principale di ricerca
   Qui gestisco la ricerca di cocktail o ingredienti
   Ho cercato di ottimizzarla usando Promise.all per le chiamate API
============================================================ */
const cerca = async (elemento) => {
    const baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';
    const el = elemento.toLowerCase().trim();
    let url = '';
    const contenitore = document.getElementById('container-cocktail');
    contenitore.innerHTML = '';

    // Controllo se quello che scrive l’utente è un nome cocktail o un ingrediente
    const cocktailMatch = allCocktails.map(c => c.toLowerCase()).some(c => c.trim() === el);
    const ingredientMatch = allIngredients.map(i => i.toLowerCase()).some(i => i.trim() === el);

    // In base a cosa è stato trovato, imposto l’URL giusto per l’API
    if (cocktailMatch) {
        url = `${baseUrl}search.php?s=${elemento}`;
    } else if (ingredientMatch) {
        url = `${baseUrl}filter.php?i=${elemento}`;
    } else {
        url = `${baseUrl}search.php?s=${elemento}`;
    }

    // Aggiungo dei “placeholder shimmer” per far vedere che sta caricando
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

    try {
        // Faccio la chiamata API
        const response = await fetch(url);
        const json = await response.json();
        const drinks = json.drinks || [];

        // Se non ci sono risultati, mostro un messaggio
        if (drinks.length === 0) {
            contenitore.innerHTML = `<p class="no-results">Nessun cocktail trovato per "${elemento}"</p>`;
            return;
        }

        let dettagli = [];

        // Se l’utente ha cercato un ingrediente, devo fare altre chiamate per ottenere i dettagli
        if (ingredientMatch) {
            const detailPromises = drinks.map(d => 
                fetch(`${baseUrl}lookup.php?i=${d.idDrink}`)
                    .then(res => res.json())
                    .then(data => data.drinks && data.drinks[0] ? data.drinks[0] : null)
                    .catch(err => {
                        console.warn(`Errore nel caricamento di ${d.idDrink}`, err);
                        return null;
                    })
            );
            
            const allDetails = await Promise.all(detailPromises);
            dettagli = allDetails.filter(d => d !== null);

            if (dettagli.length === 0) {
                contenitore.innerHTML = `<p class="no-results">Nessun dettaglio trovato per i cocktail con "${elemento}"</p>`;
                return;
            }

        } else {
            // Se invece è un cocktail, prendo direttamente i risultati
            dettagli = drinks;
            
            // Aggiungo nuovi cocktail alla lista globale per i suggerimenti
            dettagli.forEach(c => {
                if (!allCocktails.includes(c.strDrink)) {
                    allCocktails.push(c.strDrink);
                }
            });
        }

        contenitore.innerHTML = '';

        // Mostro al massimo 20 risultati
        dettagli.slice(0, 20).forEach((cocktail, index) => {
            const card = document.createElement('div');
            card.classList.add('card-cocktail');

            // Creo la lista degli ingredienti per ogni cocktail
            let ingredientiHTML = '';
            for (let i = 1; i <= 15; i++) {
                const ingrediente = cocktail[`strIngredient${i}`];
                if (ingrediente) ingredientiHTML += `<p class="tag">${ingrediente}</p>`;
            }

            // Struttura della card del cocktail
            card.innerHTML = `
                <img class="img-cocktail" src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}">
                <h2 class="title-cocktail">${cocktail.strDrink}</h2>
                <div class="tag-ingredienti-cocktail">${ingredientiHTML}</div>
                <button class="btn-view-ricetta" data-id="${cocktail.idDrink}">Ricetta</button>
            `;

            // Effetto di comparsa graduale
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = 1;
                card.style.transform = 'translateY(0)';
            }, index * 100);

            contenitore.appendChild(card);
        });

        // Aggiungo il click sul bottone “Ricetta” per ogni card
        document.querySelectorAll('.btn-view-ricetta').forEach(btn => {
            btn.addEventListener('click', e => mostraRicetta(e.target.dataset.id));
        });

    } catch (err) {
        console.error('Errore durante la ricerca:', err);
        contenitore.innerHTML = `<p class="error">Errore durante la ricerca. Riprova più tardi.</p>`;
    }
};


/* ============================================================
   Caricamento solo degli ingredienti all’avvio
   Così evito di fare troppe chiamate API (errore 429)
============================================================ */
const searchAllIngredients = async () => {
    const baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';
    
    const ingredientPromise = fetch(`${baseUrl}list.php?i=list`).then(r => r.json());

    try {
        const ingredientJson = await ingredientPromise;

        if (ingredientJson.drinks) {
            allIngredients = ingredientJson.drinks.map(i => i.strIngredient1);
        }

        console.log('Lista ingredienti caricata');
    } catch (err) {
        console.error('Errore nel caricamento ingredienti:', err);
    }
};


/* ============================================================
   Sistema dei suggerimenti
   Qui gestisco la lista di ingredienti e cocktail che compaiono
   mentre l’utente scrive nella barra di ricerca
============================================================ */
const suggestions = () => {
    const query = searchText.value.toLowerCase().trim();
    suggestionsList.innerHTML = '';
    if (!query) return;

    filteredIngredients = allIngredients
        .map(i => i.toLowerCase())
        .filter(i => i.includes(query))
        .slice(0, 5);

    filteredCocktails = allCocktails
        .map(c => c.toLowerCase())
        .filter(c => c.includes(query))
        .slice(0, 5);

    const combined = [
        ...filteredCocktails.map(c => ({ name: c, type: 'cocktail' })),
        ...filteredIngredients.map(i => ({ name: i, type: 'ingredient' }))
    ].slice(0, 10);

    // Mostro fino a 10 suggerimenti totali
    combined.forEach(item => {
        const li = document.createElement('li');
        const displayName = item.name.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        
        li.textContent = displayName;
        li.dataset.type = item.type;
        suggestionsList.appendChild(li);

        // Quando clicco su un suggerimento, lo imposto nel campo e avvio la ricerca
        li.addEventListener('click', () => {
            searchText.value = item.name; 
            suggestionsList.innerHTML = '';
            searchCocktail(); 
        });
    });
};


/* ============================================================
   Mostro 9 cocktail casuali all’avvio
   Anche qui uso Promise.all per caricarli insieme
============================================================ */
const mostraRandomCocktail = async () => {
    const contenitore = document.getElementById('container-cocktail');
    contenitore.innerHTML = '';

    const NUM_COCKTAILS = 9;

    // Placeholder mentre carica
    for (let i = 0; i < NUM_COCKTAILS; i++) {
        const placeholder = document.createElement('div');
        placeholder.classList.add('card-cocktail', 'loading');
        placeholder.innerHTML = `
            <div class="img-placeholder"></div>
            <div class="title-placeholder"></div>
            <div class="tags-placeholder"></div>
        `;
        contenitore.appendChild(placeholder);
    }
    
    // Creo le promesse per ottenere cocktail random
    const randomPromises = [];
    for (let i = 0; i < NUM_COCKTAILS; i++) {
        randomPromises.push(
            fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php')
                .then(r => r.json())
                .then(json => json.drinks[0])
                .catch(err => {
                    console.error('Errore caricamento random:', err);
                    return null;
                })
        );
    }

    const randomDrinks = await Promise.all(randomPromises);
    
    contenitore.innerHTML = ''; 

    // Mostro le card dei cocktail caricati
    randomDrinks.filter(c => c !== null).forEach((cocktail, index) => {
        const card = document.createElement('div');
        card.classList.add('card-cocktail');

        let ingredientiHTML = '';
        for (let i = 1; i <= 15; i++) {
            const ingrediente = cocktail[`strIngredient${i}`];
            if (ingrediente) ingredientiHTML += `<p class="tag">${ingrediente}</p>`;
        }

        card.innerHTML = `
            <img class="img-cocktail" src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}">
            <h2 class="title-cocktail">${cocktail.strDrink}</h2>
            <div class="tag-ingredienti-cocktail">${ingredientiHTML}</div>
            <button class="btn-view-ricetta" data-id="${cocktail.idDrink}">Ricetta</button>
        `;

        // Animazione di comparsa
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, index * 100);

        contenitore.appendChild(card);
    });
    
    document.querySelectorAll('.btn-view-ricetta').forEach(btn => {
        btn.addEventListener('click', e => mostraRicetta(e.target.dataset.id));
    });
};


/* ============================================================
   Mostra la ricetta completa di un cocktail
   Aggiungo anche il tasto per tornare indietro
============================================================ */
const mostraRicetta = (id) => {
    suggestionsList.innerHTML = ''; // Chiudo i suggerimenti se erano aperti
    
    const url = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(url)
        .then(r => r.json())
        .then(json => {
            const obj = json.drinks[0];
            if (!obj) {
                console.error("Dettagli ricetta non trovati.");
                return;
            }

            let ingredientiHTML = '';
            for (let i = 1; i <= 15; i++) {
                const ingrediente = obj[`strIngredient${i}`];
                if (ingrediente) {
                    const misura = obj[`strMeasure${i}`] || '';
                    ingredientiHTML += `
                        <div class="ingrediente" style="animation-delay:${i * 0.1}s">
                            <img src="https://www.thecocktaildb.com/images/ingredients/${ingrediente}.png" alt="${ingrediente}">
                            <p>${misura} ${ingrediente}</p>
                        </div>`;
                }
            }

            const container = document.createElement('div');
            container.setAttribute('class', 'drink-container');

            const bg = document.createElement('div');
            bg.classList.add('drink-bg');
            bg.style.background = `linear-gradient(rgba(15,14,12,0.85), rgba(15,14,12,0.95)), url('${obj.strDrinkThumb}') center/contain no-repeat`;
            container.appendChild(bg);

            const istruzioni = obj.strInstructionsIT || obj.strInstructions || 'Istruzioni non disponibili.';

            container.innerHTML += `
            <p class="back-arrow">Torna ai cocktail</p>
            <div class="drink-content">
                <h1 class="drink-title">${obj.strDrink}</h1>
                <h2 class="ingre">Ingredienti</h2>
                <div class="ingredienti">${ingredientiHTML}</div>
                <h2>Preparazione</h2>
                <p class="istruzioni">${istruzioni}</p>
            </div>`;

            document.body.appendChild(container);

            document.querySelector('.back-arrow').addEventListener('click', () => {
                container.remove();
            });
            
            const closeOnEsc = (e) => {
                if (e.key === 'Escape') {
                    container.remove();
                    document.removeEventListener('keydown', closeOnEsc);
                }
            };
            document.addEventListener('keydown', closeOnEsc);
            
            const parallaxScroll = () => {
                const scrollPos = window.scrollY;
                bg.style.transform = `translateY(${scrollPos * 0.3}px)`;
            };
            window.addEventListener('scroll', parallaxScroll);
        })
        .catch(err => console.error(err));
};


/* ============================================================
   Event listeners principali
   Gestisco invio, click, caricamento e chiusura suggerimenti
============================================================ */
const searchCocktail = () => {
    const value = searchText.value.trim();
    if (!value) {
        searchText.focus();
        return;
    }
    cerca(value);
    searchText.value = '';
    suggestionsList.innerHTML = '';
    searchText.focus();
};

// Quando premo Enter, faccio partire la ricerca
searchText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchCocktail();
    }
});

btnSearch.addEventListener('click', searchCocktail);
searchText.addEventListener('input', suggestions);

// Chiudo i suggerimenti se clicco fuori
document.addEventListener('click', (e) => {
    if (!searchText.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.innerHTML = '';
    }
});

// All’avvio metto il focus sulla barra di ricerca
window.addEventListener('load', () => {
    searchText.focus();
});

// Quando la pagina è pronta, carico cocktail random e lista ingredienti
window.addEventListener('DOMContentLoaded', async () => {
    mostraRandomCocktail(); 
    searchAllIngredients(); 
});
