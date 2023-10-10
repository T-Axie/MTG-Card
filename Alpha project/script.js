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

    for (let i = 0; i < csvDataArray.length; i += batchSize) {
        const batch = csvDataArray.slice(i, i + batchSize);
        const cardPromises = batch.map((csvData) => fetchCardData(csvData.ID));
        const batchCardData = await Promise.all(cardPromises);

        for (let j = 0; j < batchCardData.length; j++) {
            const cardData = { ...batchCardData[j] };
            const csvData = batch[j];

            if (cardData && cardData.colors && cardData.colors.length > 0) {
                cardData.copy = csvData.Copy;
                cardData.condition = csvData.Condition;
                cardData.name = cardData.name;
                cardData.foil = csvData.Foil.toLowerCase() === 'oui';

                let languageCode = csvData.Langue;
                if (languageCode === 'EN') {
                    languageCode = 'GB';
                }
                const flagImageUrl = `https://flagsapi.com/${languageCode}/shiny/64.png`;

                const cardDiv = createCardElement(cardData, flagImageUrl);
                organizeCardsByColor(cardData.colors, cardDiv);
            }
        }
    }
    displaySortedCards();
}

// Fonction pour créer un élément de carte
function createCardElement(cardData, flagImageUrl) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

    if (cardData.foil) {
        const foilImage = document.createElement('img');
        foilImage.src = 'etoile.png';
        foilImage.alt = 'Foil';
        foilImage.classList.add('foil-icon');
        cardDiv.appendChild(foilImage);
        cardDiv.classList.add('foil');
    }

    cardDiv.innerHTML = `
        <div class="card-image-container">
            <img src="${cardData.image_uris.normal}" alt="${cardData.name}">
        </div>
        <p><b>${cardData.copy}</b></p>
        <p>${cardData.condition}</p>
        
        <p>
            <img src="${flagImageUrl}" alt="${cardData.langue}">
            ${cardData.foil ? '<img src="/Alpha project/jpeg/etoile.png" alt="Foil" class="foil-icon">' : ''}
        </p>
    `;

    return cardDiv;
}

// Fonction pour organiser les cartes par couleur
function organizeCardsByColor(colors, cardDiv) {
    if (colors.length === 0) {
        colors.push('Non définie');
    }

    colors.forEach((color) => {
        if (!cardsByColor[color]) {
            cardsByColor[color] = [];
        }
        cardsByColor[color].push(cardDiv.cloneNode(true));
    });
}

// Fonction pour afficher les cartes triées
function displaySortedCards() {
    const cardGrid = document.getElementById('cardGrid');
    for (const color in cardsByColor) {
        if (cardsByColor.hasOwnProperty(color)) {
            const cardsInColor = cardsByColor[color];
            cardsInColor.sort((a, b) => {
                const nameA = a.querySelector('img').alt;
                const nameB = b.querySelector('img').alt;
                return nameA.localeCompare(nameB);
            });
            cardsInColor.forEach((card) => {
                cardGrid.appendChild(card);
            });
        }
    }
}

// Fonction pour rechercher une carte sur Scryfall par son ID
async function fetchCardData(cardID) {
    try {
        const response = await fetch(`https://api.scryfall.com/cards/${cardID}`);
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Erreur lors de la récupération des données de la carte depuis Scryfall.');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de la carte depuis Scryfall:', error);
        return null;
    }
}

const filterSelect = document.getElementById('filterSelect');

filterSelect.addEventListener('change', function () {
    const selectedValue = filterSelect.value;
    sortAndDisplayCards(selectedValue);
});

function sortAndDisplayCards(sortBy) {
    const cardGrid = document.getElementById('cardGrid');
    cardGrid.innerHTML = ''; // Efface le contenu actuel de la grille

    for (const color in cardsByColor) {
        if (cardsByColor.hasOwnProperty(color)) {
            const cardsInColor = cardsByColor[color];

            if (sortBy === 'foil') {
                // Filtrer les cartes "foil" uniquement
                const foilCards = cardsInColor.filter((card) => card.classList.contains('foil'));
                foilCards.forEach((card) => {
                    cardGrid.appendChild(card);
                });
            } else {
                // Toutes les autres options de tri
                cardsInColor.sort((a, b) => {
                    const nameA = a.querySelector('.card-image-container img').alt;
                    const nameB = b.querySelector('.card-image-container img').alt;

                    if (sortBy === 'colorName') {
                        // Triez d'abord par couleur, puis par nom
                        const nameA = a.querySelector('.card-image-container img').alt;
                        const nameB = b.querySelector('.card-image-container img').alt;
                        
                        const colorComparison = a.querySelector('img').alt.localeCompare(b.querySelector('img').alt);
                        if (colorComparison === 0) {
                            return nameA.localeCompare(nameB);
                        }
                        return colorComparison;
                    } else if (sortBy === 'name') {
                        // Triez par nom uniquement
                        return nameA.localeCompare(nameB);
                    }
                });

                cardsInColor.forEach((card) => {
                    cardGrid.appendChild(card);
                });
            }
        }
    }
}



// Fonction pour la recherche de carte
searchInput.addEventListener('input', filterCards);

function filterCards() {
    const searchText = searchInput.value.trim().toLowerCase();
    const cardContainers = document.querySelectorAll('.card');

    cardContainers.forEach((cardContainer) => {
        const cardName = cardContainer.querySelector('img').alt.toLowerCase();

        if (cardName.includes(searchText)) {
            cardContainer.style.display = 'block';
        } else {
            cardContainer.style.display = 'none';
        }
    });
}

// Exécute la fonction de chargement des données lors du chargement de la page
document.addEventListener('DOMContentLoaded', loadCardData);