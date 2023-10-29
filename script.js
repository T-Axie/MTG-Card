// Fonction de mappage pour la condition
function mapCondition(conditionValue) {
    const conditionMap = {
        '7': 'Mint',
        '6': 'Near Mint',
        '5': 'Excellent',
        '4': 'Good',
        '3': 'Lightly Played',
        '2': 'Played',
        '1': 'Poor'
    };
    return conditionMap[conditionValue] || 'Unknown';
}

// Fonction de mappage pour la langue
function mapLanguage(languageValue) {
    const languageMap = {
        '11': 'TW',
        '10': 'KR',
        '9': 'RU',
        '8': 'PT',
        '7': 'JP',
        '6': 'CN',
        '5': 'IT',
        '4': 'ES',
        '3': 'DE',
        '2': 'FR',
        '1': 'GB'
    };
    return languageMap[languageValue] || 'Unknown';
}

// Fonction pour charger le CSV à partir d'un fichier
async function loadCSV() {
    try {
        const response = await fetch('donnees.csv');
        if (!response.ok) {
            console.error('Erreur lors du chargement du fichier CSV.');
            throw new Error('Erreur lors du chargement du fichier CSV.');
        }
        const csvText = await response.text();
        return csvText;
    } catch (error) {
        console.error('Erreur lors du chargement du fichier CSV:', error);
        throw error;
    }
}

const searchInput = document.getElementById('searchInput');
const cardsByColor = {};



// Fonction pour charger les données depuis le CSV et les cartes depuis Scryfall
async function loadCardData() {
    try {
        const csvText = await loadCSV();
        if (!csvText) return;

        const batchSize = 100;
        const csvDataArray = Papa.parse(csvText, { header: true }).data;
        const totalCards = csvDataArray.length;
        let cardsLoaded = 0;

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const groupSize = 10;

        for (let i = 0; i < csvDataArray.length; i += batchSize) {
            const batch = csvDataArray.slice(i, i + batchSize);
            const groupedMKMProductIDs = [];

            for (let j = 0; j < batch.length; j += groupSize) {
                const group = batch.slice(j, j + groupSize);
                const groupMKMProductIDs = group.map(item => item.MkmProductId);
                groupedMKMProductIDs.push(groupMKMProductIDs);
            }

            for (let j = 0; j < groupedMKMProductIDs.length; j++) {
                await delay(100);
                const cardPromises = groupedMKMProductIDs[j].map(fetchCardDataByMKMProductId);
                const groupCardData = await Promise.all(cardPromises);

                cardsLoaded += groupCardData.length;

                for (let k = 0; k < groupCardData.length; k++) {
                    const cardData = { ...groupCardData[k] };
                    const csvData = batch[j * groupSize + k];

                    if (cardData) {
                        cardData.copy = csvData.Count;
                        cardData.condition = mapCondition(csvData.Condition);
                        cardData.name = csvData.Name;
                        if (csvData.Price) {
                            cardData.price = parseFloat(csvData.Price.replace(',', '.'));
                        } else {
                            cardData.price = 0;
                        }

                        cardData.foil = csvData.IsFoil === '1';

                        const languageName = mapLanguage(csvData.Language);
                        const flagImageUrl = `https://flagsapi.com/${languageName}/shiny/64.png`;

                        const cardDiv = createCardElement(cardData, flagImageUrl);
                        displayCard(cardDiv);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}


// Fonction pour afficher une carte
function displayCard(cardDiv) {
    const cardGrid = document.getElementById('cardGrid');
    cardGrid.appendChild(cardDiv);
}




function createCardElement(cardData, flagImageUrl) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.setAttribute('data-name', cardData.name);
    cardDiv.setAttribute('data-no-image', 'true');
    cardDiv.setAttribute('data-foil', cardData.foil ? 'foil' : 'no-foil');


    let color = 'colorless';
if (cardData.colors && cardData.colors.length > 0) {
    if (cardData.colors.length === 1) {
        color = cardData.colors[0].toLowerCase();  // single color
    } else {
        color = 'multicolor';  // more than one color
    }
}

// Map Scryfall abbreviations to color names
const colorMapping = {
    'w': 'white',
    'u': 'blue',
    'b': 'black',
    'r': 'red',
    'g': 'green'
};

if (color in colorMapping) {
    color = colorMapping[color];
}

cardDiv.setAttribute('data-color', color);

    const mkmLink = document.createElement('a');

    if (cardData.image_uris && cardData.image_uris.normal) {
        const cardImageLink = document.createElement('a');
        cardImageLink.href = cardData.purchase_uris && cardData.purchase_uris.cardmarket ? cardData.purchase_uris.cardmarket : '#'; // Utilisez une URL par défaut si l'URL MKM n'est pas disponible
        cardImageLink.target = '_blank'; // Ouvre dans un nouvel onglet
    
        const cardImage = document.createElement('img');
        cardImage.src = cardData.image_uris.normal;
        cardImage.alt = cardData.name;
        cardDiv.setAttribute('data-price', cardData.price);
    
        cardImage.onload = () => {
            cardDiv.removeAttribute('data-no-image');
        };
    
        cardImage.onerror = () => {
            cardDiv.setAttribute('data-no-image', 'true');
            console.error(`Impossible de charger l'image pour la carte: ${cardData.name}`);
            cardDiv.style.display = 'none'; // Masquez la carte
        };
    
        cardImageLink.appendChild(cardImage); // Ajoutez l'image au lien
    
        const cardImageContainer = document.createElement('div');
        cardImageContainer.classList.add('card-image-container');
        cardImageContainer.appendChild(cardImageLink); // Ajoutez le lien contenant l'image au conteneur
        cardDiv.appendChild(cardImageContainer);
    } 
    else {
        // Si aucune image n'est disponible, ne rien ajouter à la carte
        console.error(`Aucune image disponible pour la carte: ${cardData.name}`);
        cardDiv.style.display = 'none'; // Masquez la carte
    }

    cardDiv.innerHTML += `
        <p><b>${cardData.copy}</b></p>
        <p>${cardData.condition}</p>
        <p>Price: <b>${cardData.price.toFixed(2)}</b>€</p>
        <p>
            <img src="${flagImageUrl}">
            ${cardData.foil ? '<img src="/jpeg/etoile.png" alt="Foil" class="foil-icon">' : ''}
        </p>
        <p>${mkmLink.outerHTML}</p>
    `;

    return cardDiv;
}


// Fonction pour rechercher une carte sur Scryfall par son "MKM Product ID" de Cardmarket
async function fetchCardDataByMKMProductId(mkmProductId) {
    const headers = new Headers({
        'User-Agent': 'MonApplication/1.0', // Remplacez par un nom d'application approprié et sa version
        'Accept': 'application/json;q=0.9,*/*;q=0.8'
    });
    try {
        const response = await fetch(`https://api.scryfall.com/cards/cardmarket/${mkmProductId}`, { Headers });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Erreur lors de la récupération des données de la carte depuis Scryfall. Statut de la réponse:', response.status);
            console.error('Réponse complète:', response);
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de la carte depuis Scryfall:', error);
        return null;
    }
}



function searchCardByName() {
    const searchText = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card) => {
        const cardName = card.getAttribute('data-name').toLowerCase();
        const hasNoImage = card.getAttribute('data-no-image') === 'true'; // Récupère l'attribut personnalisé

        // Seules les cartes correspondant au texte et ayant une image sont affichées
        if (cardName.includes(searchText) && !hasNoImage) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

document.getElementById('sort-all').addEventListener('click', (event) => {
    event.preventDefault();  // Empêcher le comportement par défaut du bouton
    updateColorFilter('all');
});

const activeFilters = {
    color: 'all',
    foil: 'all',
    price: 'all'
};

function updateColorFilter(color) {
    activeFilters.color = color;
    updateButtonState('color', color);
    applyFilters();
}

function updateFoilFilter(foilType) {
    activeFilters.foil = foilType;
    updateButtonState('foil', foilType);
    applyFilters();
}

function updateButtonState(filterType, activeValue) {
    const buttonEls = document.querySelectorAll(`[data-filter-${filterType}]`);
    
    buttonEls.forEach(btn => {
        const btnValue = btn.getAttribute(`data-filter-${filterType}`);
        if (btnValue === activeValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateButtonState('color', activeFilters.color);
    updateButtonState('foil', activeFilters.foil);
});



const colorFilterButtons = document.querySelectorAll('[data-filter-color]');

colorFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const color = button.getAttribute('data-filter-color');
        updateColorFilter(color);
    });
});
let activeFoilFilter = 'all';
let activeColorFilter = 'all';



function applyFilters() {
    const cards = document.querySelectorAll('.card');

    cards.forEach((card) => {
        const cardFoil = card.getAttribute('data-foil');
        const cardColor = card.getAttribute('data-color');
        const cardPrice = parseFloat(card.getAttribute('data-price'));
        const hasNoImage = card.getAttribute('data-no-image') === 'true';
        let matchesFoilFilter = false;
        let matchesPriceFilter = false;

        if (activeFilters.foil === 'all') {
            matchesFoilFilter = true;
        } else if (activeFilters.foil === 'foil' && cardFoil === 'foil') {
            matchesFoilFilter = true;
        } else if (activeFilters.foil === 'no-foil' && cardFoil !== 'foil') {
            matchesFoilFilter = true;
        }

        const matchesColorFilter = activeFilters.color === 'all' || cardColor === activeFilters.color;

        // Filtrage par prix
        const priceFilter = activeFilters.price;

        if (priceFilter === 'all') {
            matchesPriceFilter = true; // Laisse passer toutes les cartes si "All prices" est sélectionné
        } else {
            const [minPrice, maxPrice] = priceFilter.split('-');
            if (minPrice && maxPrice) {
                const min = minPrice === '0' ? 0.01 : parseFloat(minPrice);
                console.log('Card Price:', cardPrice);
                console.log('Price Filter:', priceFilter);
                if (cardPrice >= min && cardPrice <= parseFloat(maxPrice)) {
                    matchesPriceFilter = true;
                }
            }
        }

        // Vérification de toutes les conditions de filtrage
        if (matchesFoilFilter && matchesColorFilter && matchesPriceFilter && !hasNoImage) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

document.getElementById('foilSelect').addEventListener('change', function() {
    const value = this.value;

    switch (value) {
        case 'foil':
            activeFilters.foil = 'foil';
            break;
        case 'no-foil':
            activeFilters.foil = 'no-foil';
            break;
        case 'all':
            activeFilters.foil = 'all';
            break;
    }
    applyFilters(); // Appliquez les filtres après avoir mis à jour le filtre actif
});

document.getElementById('priceRangeSelect').addEventListener('change', function () {
    const value = this.value;

    switch (value) {
        case '5-10':
            activeFilters.price = '5-10';
            break;
        case '10-50':
            activeFilters.price = '10-50';
            break;
        case '50-1000':
            activeFilters.price = '50-1000';
            break;
        case 'all':
            activeFilters.price = 'all';
            break;
    }

    applyFilters();
});



// Écoutez l'événement 'input' sur l'élément de recherche
searchInput.addEventListener('input', function () {
    const searchText = searchInput.value.toLowerCase();
    searchCardByName();
});

// Exécute la fonction de chargement des données lors du chargement de la page
searchInput.disabled = true;
document.addEventListener('DOMContentLoaded', async function() {
    await loadCardData();
    searchInput.disabled = false;
});

