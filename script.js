const btnSearch = document.getElementById('search');
const searchText = document.getElementById('search-text');
const suggestionsList = document.getElementById('ingredient-suggestions');

let filteredIngredients = [];
let filteredCocktails = [];
let allCocktails = [];
let allIngredients = [];

/* ============================================================
   🔍 Funzione principale di ricerca
============================================================ */
const cerca = async (elemento) => {
    const baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';
    const el = elemento.toLowerCase().trim();
    let url = '';
    const contenitore = document.getElementById('container-cocktail');
    contenitore.innerHTML = '';

    const cocktailMatch = filteredCocktails.some(c => c.toLowerCase().trim() === el);
    const ingredientMatch = filteredIngredients.some(i => i.toLowerCase().trim() === el);

    if (cocktailMatch) {
        url = `${baseUrl}search.php?s=${elemento}`;
    } else if (ingredientMatch) {
        url = `${baseUrl}filter.php?i=${elemento}`;
    } else {
        url = `${baseUrl}search.php?s=${elemento}`;
    }

    // Placeholder shimmer
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
        const response = await fetch(url);
        const json = await response.json();
        const drinks = json.drinks || [];

        if (drinks.length === 0) {
            contenitore.innerHTML = `<p class="no-results">Nessun cocktail trovato per "${elemento}"</p>`;
            return;
        }

        // Se è una ricerca per ingrediente → fetch dettagli per ogni id
        let dettagli = [];
        if (ingredientMatch) {
            for (const d of drinks) {
                try {
                    const res = await fetch(`${baseUrl}lookup.php?i=${d.idDrink}`);
                    const data = await res.json();
                    if (data.drinks && data.drinks[0]) dettagli.push(data.drinks[0]);
                } catch (err) {
                    console.warn(`Errore nel caricamento di ${d.idDrink}`, err);
                }
            }
        } else {
            dettagli = drinks;
        }

        contenitore.innerHTML = '';

        dettagli.slice(0, 20).forEach((cocktail, index) => {
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

    } catch (err) {
        console.error('Errore durante la ricerca:', err);
        contenitore.innerHTML = `<p class="error">Errore durante la ricerca. Riprova più tardi.</p>`;
    }
};

/* ============================================================
   📦 Caricamento di tutti i cocktail e ingredienti (in background)
============================================================ */
const searchAllIngredients = async () => {
    const chars = [
        ...Array.from({ length: 10 }, (_, i) => i.toString()),
        ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))
    ];

    const promises = chars.map(char =>
        fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${char}`).then(r => r.json())
    );

    try {
        const results = await Promise.all(promises);
        results.forEach(json => {
            if (json.drinks) allCocktails.push(...json.drinks.map(c => c.strDrink));
        });

        const risposta = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list');
        const json = await risposta.json();
        json.drinks.forEach(i => allIngredients.push(i.strIngredient1));

        console.log('✅ Tutti gli ingredienti e cocktail caricati');
    } catch (err) {
        console.error('Errore nel caricamento ingredienti:', err);
    }
};

/* ============================================================
   💡 Sistema suggerimenti (cocktail + ingredienti)
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
    ];

    combined.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.dataset.type = item.type;
        suggestionsList.appendChild(li);

        li.addEventListener('click', () => {
            searchText.value = item.name;
            suggestionsList.innerHTML = '';
        });
    });
};

/* ============================================================
   🍸 Mostra cocktail random all’avvio
============================================================ */
const mostraRandomCocktail = async () => {
    const contenitore = document.getElementById('container-cocktail');
    contenitore.innerHTML = '';

    const cocktailSet = new Set();

    // Placeholder shimmer
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

    while (cocktailSet.size < 9) {
        const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const json = await response.json();
        cocktailSet.add(json.drinks[0]);
    }

    Array.from(contenitore.children).forEach((card, index) => {
        const cocktail = Array.from(cocktailSet)[index];
        card.classList.remove('loading');

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

        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    document.querySelectorAll('.btn-view-ricetta').forEach(btn => {
        btn.addEventListener('click', e => mostraRicetta(e.target.dataset.id));
    });
};

/* ============================================================
   📋 Mostra ricetta completa
============================================================ */
const mostraRicetta = (id) => {
    const url = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(url)
        .then(r => r.json())
        .then(json => {
            const obj = json.drinks[0];

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

            container.innerHTML += `
            <p class="back-arrow">Torna ai cocktail</p>
            <div class="drink-content">
                <h1 class="drink-title">${obj.strDrink}</h1>
                <h2 class="ingre">Ingredienti</h2>
                <div class="ingredienti">${ingredientiHTML}</div>
                <h2>Preparazione</h2>
                <p class="istruzioni">${obj.strInstructionsIT}</p>
            </div>`;

            document.body.appendChild(container);

            window.addEventListener('scroll', () => {
                const scrollPos = window.scrollY;
                bg.style.transform = `translateY(${scrollPos * 0.3}px)`;
            });

            document.querySelector('.back-arrow').addEventListener('click', () => {
                container.remove();
            });
        })
        .catch(err => console.error(err));
};

/* ============================================================
   🚀 Avvio e Event Listeners
============================================================ */
const searchCocktail = () => {
    const value = searchText.value.trim();
    if (!value) {
        searchText.focus();
        return;
    }
    cerca(value);
    searchText.value = '';
    searchText.focus();
};

searchText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchCocktail();
        suggestionsList.innerHTML = '';
    }
});

window.addEventListener('load', () => {
    searchText.focus();
});

window.addEventListener('DOMContentLoaded', async () => {
    await mostraRandomCocktail();
    searchAllIngredients(); // carica in background
});

searchText.addEventListener('input', suggestions);
btnSearch.addEventListener('click', searchCocktail);
