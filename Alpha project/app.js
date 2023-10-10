// app.js
const rarityMap = {
    0: "Common",
    1: "Uncommon",
    2: "Rare",
    11: "Enchanted",
    12: "Legendary",
    13: "SuperRare",
    15: "Promos",
    // Ajoutez d'autres correspondances si nécessaire
};

let cards = []; 


Papa.parse('LorcanaData.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        cards = results.data;
        cards = cards.map(card => {
            if (!isNaN(card.ExLow)) { // Vérifiez si card.ExLow est un nombre
                // card.ExLow est déjà un nombre, pas besoin de conversion
            } else if (typeof card.ExLow === 'string') {
                // Vérifiez d'abord si la chaîne contient une virgule
                if (card.ExLow.includes(',')) {
                    // Remplacez les virgules par des points et utilisez parseFloat
                    card.ExLow = parseFloat(card.ExLow.replace(',', '.'));
                } else {
                    // Utilisez parseInt pour les nombres entiers
                    card.ExLow = parseInt(card.ExLow);
                }
                
                if (isNaN(card.ExLow)) {
                    console.error('Invalid number format for card:', card.Name, card.ExLow);
                    card.ExLow = 0;
                }
            } else {
                card.ExLow = 0;
            }
            
            return card;
        });
    }
});


document.getElementById('card-search').addEventListener('input', function(e) {
    const input = e.target.value.toLowerCase();
    const suggestionsContainer = document.getElementById('suggestions-container');
    
    suggestionsContainer.innerHTML = '';

    const filteredCards = cards.filter(card => {
        return card.Name &&
            card.Name.toLowerCase().includes(input);
    });

    filteredCards.forEach(card => {
        const suggestionElement = document.createElement('div');
        suggestionElement.textContent = card.Name;
        suggestionElement.className = 'suggestion'; // Ajoutez la classe "suggestion"

        suggestionElement.addEventListener('mouseenter', function () {
            // Changez la couleur de fond lorsque vous survolez la suggestion
            suggestionElement.style.backgroundColor = 'lightgray';
        });
    
        suggestionElement.addEventListener('mouseleave', function () {
            // Rétablissez la couleur de fond lorsque vous quittez la suggestion
            suggestionElement.style.backgroundColor = '';
        });

        suggestionElement.onclick = function() {
            document.getElementById('card-search').value = card.Name;
            suggestionsContainer.innerHTML = ''; 
        };
        suggestionsContainer.appendChild(suggestionElement);
    });
});

function formatCardName(name) {
    return name.toLowerCase().replace(/ /g, '_');
    
}

let cardContainer = document.getElementById('cardGrid'); // Déplacez la définition ici

function createCardElement(cardData, quantity, price, mkmUrl, isFoil, language) {
    quantity = parseInt(quantity, 10);
    price = parseFloat(price);
    const cardElement = document.createElement("div");
    cardElement.className = "card";

    // Créez un lien autour de l'image avec l'URL correcte
    const cardLink = document.createElement("a");
    cardLink.href = `https://www.cardmarket.com${mkmUrl}`;
    cardLink.target = "_blank"; // Ouvre le lien dans une nouvelle fenêtre/onglet
    cardElement.appendChild(cardLink);

    const imgElement = document.createElement("img");
    imgElement.src = cardData["image-urls"].small;
    cardLink.appendChild(imgElement);

    const cardInfoContainer = document.createElement('div');
    cardInfoContainer.className = 'card-info-container'; // Ajoutez une classe pour le centrage

    const cardQuantityLabel = document.createElement("p");
    cardQuantityLabel.className = "card-quantity";
    cardQuantityLabel.textContent = `Quantity: ${quantity}`;
    cardInfoContainer.appendChild(cardQuantityLabel);

    // Créez un élément img pour le drapeau en fonction de la langue sélectionnée
    const languageFlag = document.createElement('img');
    languageFlag.className = 'language-flag';
    languageFlag.src = getFlagImageUrl(language); // Utilisez la fonction pour obtenir l'URL du drapeau
    languageFlag.alt = language === 'EN' ? 'English' : 'Français'; // Définissez l'attribut alt en conséquence
    cardInfoContainer.appendChild(languageFlag);

    if (isFoil) {
        const foilIcon = document.createElement('img');
        foilIcon.src = '/Alpha project/jpeg/etoile.png'; // Utilisez le chemin approprié
        foilIcon.alt = 'Foil';
        foilIcon.className = 'foil-icon';
        foilIcon.style.width = '50px'; // Ajustez la largeur selon vos besoins
        foilIcon.style.height = '50px'; // Ajustez la hauteur selon vos besoins
        cardInfoContainer.appendChild(foilIcon);
    }

    cardElement.appendChild(cardInfoContainer);

    const totalPrice = price * quantity;


    // Appliquer un coefficient multiplicateur de 1.2 si la carte est en anglais
    if (language === 'en') {
        price = price * 1.2;
    }

    // Appliquer un coefficient multiplicateur de 1.5 si la carte est en français et que le prix est supérieur à 20
    // Appliquer un coefficient multiplicateur de 2 si la carte est en français et que le prix est inférieur ou égal à 20
    if (language === 'fr') {
        if (price > 4) {
            price = price * 1.5;
        } else {
            price = price * 2;
        }
    }
   

    // Appliquez une réduction de 25 % au prix
    const discountedPrice = price * 0.75;

    const priceLabel = document.createElement("p");
    priceLabel.className = "card-price";
    priceLabel.textContent = `Price: ${discountedPrice.toFixed(2)}€/p`;

    cardElement.appendChild(priceLabel);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-sm delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        // Supprimer la carte lorsqu'on clique sur le bouton "Delete"
        cardContainer.removeChild(cardElement);
        updateTotalPrice(); // Appeler updateTotalPrice après la suppression
    });

    cardElement.appendChild(deleteButton);

    return cardElement;
}

let cardList = []; // Liste des cartes avec leur quantité

document.getElementById('add-card').addEventListener('click', function() {
    const cardName = document.getElementById('card-search').value;
    const quantity = document.getElementById('card-quantity').value;
    const language = document.getElementById('language-select').value; // Obtenez la valeur sélectionnée du champ de langue
    const isFoil = document.getElementById('foil-checkbox').checked; // Vérifiez si la case "Foil" est cochée

    const cardNameInput = document.getElementById('card-search');
    const cardQuantityInput = document.getElementById('card-quantity');

    if (!cardName || !quantity) {
        alert('Please enter a card name and quantity.');
        return;
    }

    cardNameInput.value = '';
    cardQuantityInput.value = '1';

    // Filtrer les cartes par nom et ExpansionName (en excluant "Promos")
    const filteredCards = cards.filter(card =>
        card.Name === cardName &&
        (!card.ExpansionName || !card.ExpansionName.toLowerCase().includes('promos'))
    );

    if (filteredCards.length === 0) {
        alert('Card not found.');
        return;
    }

    // Sélectionnez la première carte correspondante (ou une logique de sélection appropriée)
    const selectedCard = filteredCards[0];

    // Utilisez le prix "FoilLow" si la case "Foil" est cochée, sinon utilisez "ExLow"
    const price = isFoil ? selectedCard.FoilLow : selectedCard.ExLow;

    fetch(`https://api.lorcana-api.com/fuzzy/${formatCardName(cardName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const cardContainer = document.getElementById('cardGrid');
            const cardElement = createCardElement(data, quantity, price, selectedCard.MkmUrl, isFoil, language);

            cardContainer.appendChild(cardElement);
    
            updateTotalPrice(); // Appeler updateTotalPrice après l'ajout de la carte
        })
        .catch(error => {
            console.error('Fetch Error:', error);
        });
            // Réinitialisez la case à cocher "Foil" après avoir ajouté la carte
    document.getElementById('foil-checkbox').checked = false;
});

function calculateTotalPrice() {
    const cardElements = document.querySelectorAll('.card');
    let totalCost = 0;

    cardElements.forEach(cardElement => {
        const quantity = parseInt(cardElement.querySelector('.card-quantity').textContent.split(':')[1].trim(), 10);
        
        // Utilisez une expression régulière pour extraire la valeur numérique en euros
        const priceText = cardElement.querySelector('.card-price').textContent;
        const priceMatch = priceText.match(/(\d+\.\d+)/);
        
        if (priceMatch && priceMatch[0]) {
            const price = parseFloat(priceMatch[0]);
            
            if (!isNaN(quantity) && !isNaN(price)) {
                totalCost += quantity * price;
            }
        }
    });

    const totalCostElement = document.getElementById('totalCost');
    totalCostElement.textContent = totalCost.toFixed(2) + '€';
}

function updateTotalPrice() {
    calculateTotalPrice();
}

cardContainer.addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-button')) {
        updateTotalPrice();
    }
});

function getFlagImageUrl(languageCode) {
    if (languageCode === 'en') {
        return 'https://flagsapi.com/GB/shiny/64.png'; // Drapeau anglais
    } else if (languageCode === 'fr') {
        return 'https://flagsapi.com/FR/shiny/64.png'; // Drapeau français
    }
    // Vous pouvez ajouter plus de cas pour d'autres langues si nécessaire
}