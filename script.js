// Fonction de mappage pour la condition
function mapCondition(conditionValue) {
    switch (conditionValue) {
        case '7':
            return 'Mint';
        case '6':
            return 'Near Mint';
        case '5':
            return 'Excellent';
        case '4':
            return 'Good';
        case '3':
            return 'Lightly Played';
        case '2':
            return 'Played';
        case '1':
            return 'Poor';
        default:
            return 'Unknown';
    }
}

// Fonction de mappage pour la langue
function mapLanguage(languageValue) {
    switch (languageValue) {
        case '11':
            return 'TW';
        case '10':
            return 'KR';
        case '9':
            return 'RU';
        case '8':
            return 'PT';
        case '7':
            return 'JP';
        case '6':
            return 'CN';
        case '5':
            return 'IT';
        case '4':
            return 'ES';
        case '3':
            return 'DE';
        case '2':
            return 'FR';
        case '1':
            return 'GB';
        default:
            return 'Unknown';
    }
}






// Fonction pour charger le CSV à partir d'un fichier
async function loadCSV() {
    try {
        const response = await fetch('donnees.csv');
        if (!response.ok) {
            console.error('Erreur lors du chargement du fichier CSV.');
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error('Erreur lors du chargement du fichier CSV:', error);
        return null;
    }
}

const searchInput = document.getElementById('searchInput');
const cardsByColor = {};

// Fonction pour charger les données depuis le CSV et les cartes depuis Scryfall
async function loadCardData() {
    const csvText = await loadCSV();
    if (!csvText) return;

    const batchSize = 100;
    const csvDataArray = Papa.parse(csvText, { header: true }).data;
    const totalCards = csvDataArray.length;
    let cardsLoaded = 0;

    const progressBar = document.getElementById('loading-progress');
    const progressContainer = document.querySelector('.progress');

    progressContainer.style.display = 'block';

    for (let i = 0; i < csvDataArray.length; i += batchSize) {
        const batch = csvDataArray.slice(i, i + batchSize);
        const cardPromises = batch.map((csvData) => fetchCardDataByMKMProductId(csvData.MkmProductId));
        const batchCardData = await Promise.all(cardPromises);

        cardsLoaded += batchCardData.length;
        const progressPercentage = (cardsLoaded / totalCards) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        for (let j = 0; j < batchCardData.length; j++) {
            const cardData = { ...batchCardData[j] };
            const csvData = batch[j];

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

    progressContainer.style.display = 'none'; // Masquez la barre de progression une fois le chargement terminé
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
    console.log("Card data colors:", cardData.colors);


    const mkmLink = document.createElement('a');

    if (cardData.image_uris && cardData.image_uris.normal) {
        const cardImageLink = document.createElement('a');
        cardImageLink.href = cardData.purchase_uris && cardData.purchase_uris.cardmarket ? cardData.purchase_uris.cardmarket : '#'; // Utilisez une URL par défaut si l'URL MKM n'est pas disponible
        cardImageLink.target = '_blank'; // Ouvre dans un nouvel onglet
    
        const cardImage = document.createElement('img');
        cardImage.src = cardData.image_uris.normal;
        cardImage.alt = cardData.name;
    
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
    try {
        // Utilisez l'API Scryfall pour rechercher la carte par "MKM Product ID" de Cardmarket
        const response = await fetch(`https://api.scryfall.com/cards/cardmarket/${mkmProductId}`);
        
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
    foil: 'all'
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



function filterCardsByColor(color) {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card) => {
        const cardColor = card.getAttribute('data-color');
        const hasNoImage = card.getAttribute('data-no-image') === 'true';
        
        if ((color === 'all' || cardColor === color) && !hasNoImage) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

document.getElementById('sort-all').addEventListener('click', () => updateColorFilter('all'));
document.getElementById('sort-white').addEventListener('click', () => updateColorFilter('white'));
document.getElementById('sort-blue').addEventListener('click', () => updateColorFilter('blue'));
document.getElementById('sort-black').addEventListener('click', () => updateColorFilter('black'));
document.getElementById('sort-red').addEventListener('click', () => updateColorFilter('red'));
document.getElementById('sort-green').addEventListener('click', () => updateColorFilter('green'));
document.getElementById('sort-multicolor').addEventListener('click', () => updateColorFilter('multicolor'));
document.getElementById('sort-colorless').addEventListener('click', () => updateColorFilter('colorless'));

let activeFoilFilter = 'all';
let activeColorFilter = 'all';



function applyFilters() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card) => {
        const cardFoil = card.getAttribute('data-foil');
        const cardColor = card.getAttribute('data-color');
        const hasNoImage = card.getAttribute('data-no-image') === 'true'; // Vérifiez le statut "no-image"
        
        let matchesFoilFilter = false;

        if (activeFilters.foil === 'all') {
            // Afficher toutes les cartes, qu'elles soient Foil ou non Foil
            matchesFoilFilter = true;
        } else if (activeFilters.foil === 'foil' && cardFoil === 'foil') {
            // Afficher uniquement les cartes Foil
            matchesFoilFilter = true;
        } else if (activeFilters.foil === 'no-foil' && cardFoil !== 'foil') {
            // Afficher uniquement les cartes Non-Foil
            matchesFoilFilter = true;
        }

        const matchesColorFilter = activeFilters.color === 'all' || cardColor === activeFilters.color;

        if (matchesFoilFilter && matchesColorFilter && !hasNoImage) { // Ajoutez la vérification !hasNoImage
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





// Écoutez l'événement 'input' sur l'élément de recherche
searchInput.addEventListener('input', function () {
    const searchText = searchInput.value.toLowerCase(); // Convertissez le texte de recherche en minuscules

    // Appelez la fonction de recherche avec le texte de recherche
    searchCardByName();
});


// Exécute la fonction de chargement des données lors du chargement de la page
searchInput.disabled = true; // Désactivez-le au début
document.addEventListener('DOMContentLoaded', async function() {
    await loadCardData();
    searchInput.disabled = false; // Réactivez-le une fois les données chargées
});