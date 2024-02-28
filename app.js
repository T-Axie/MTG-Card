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
let selectedCardName = '';
let cardsData ;
let cardContainer = document.getElementById('cardGrid'); // Déplacez la définition ici


// Donnée CSV + Fetch + Barre de recherche
Papa.parse('LorcanaData.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        cards = results.data;
        cards = cards.map(card => {
            if (!isNaN(card.ExLow)) {
                // card.ExLow est déjà un nombre, pas besoin de conversion
            } else if (typeof card.ExLow === 'string') {
                if (card.ExLow.includes(',')) {
                    card.ExLow = parseFloat(card.ExLow.replace(',', '.'));
                } else {
                    card.ExLow = parseInt(card.ExLow);
                }

                if (isNaN(card.ExLow)) {
                    console.error('Invalid number format for ExLow:', card.Name, card.ExLow);
                    card.ExLow = 0;
                }
            } else {
                card.ExLow = 0;
            }

            if (!isNaN(card.FoilLow)) {
                // card.FoilLow est déjà un nombre, pas besoin de conversion
            } else if (typeof card.FoilLow === 'string') {
                if (card.FoilLow.includes(',')) {
                    card.FoilLow = parseFloat(card.FoilLow.replace(',', '.'));
                } else {
                    card.FoilLow = parseInt(card.FoilLow);
                }

                if (isNaN(card.FoilLow)) {
                    console.error('Invalid number format for FoilLow:', card.Name, card.FoilLow);
                    card.FoilLow = 0;
                }
            } else {
                card.FoilLow = 0;
            }

            // Vérifiez si la colonne "Avg7" est un nombre valide
            if (!isNaN(card.Avg7)) {
                // card.Avg7 est déjà un nombre, pas besoin de conversion
            } else if (typeof card.Avg7 === 'string') {
                if (card.Avg7.includes(',')) {
                    card.Avg7 = parseFloat(card.Avg7.replace(',', '.'));
                } else {
                    card.Avg7 = parseInt(card.Avg7);
                }

                if (isNaN(card.Avg7)) {
                    console.error('Invalid number format for Avg7:', card.Name, card.Avg7);
                    card.Avg7 = 0;
                }
            } else {
                card.Avg7 = 0;
            }

            return card;
        });
 // Récupération des données de l'API après le traitement CSV
 fetch('https://api.lorcana-api.com/cards/all')
 .then(response => {
     if (!response.ok) {
         throw new Error('Erreur lors de la récupération des données des cartes');
     }
     return response.json();
 })
 .then(apiData => {
    console.log('Cartes de l\'API avant la fusion :', apiData);
     // Comparer les données de l'API avec celles du CSV
     cardsData = apiData.map(apiCard => {
         const matchingCsvCard = cards.find(csvCard => {
             return apiCard.Set_Name === csvCard.ExpansionName && apiCard.Card_Num === csvCard.CollectorNumber;
         });

         console.log('Carte API :', apiCard);
         console.log('Carte CSV correspondante :', matchingCsvCard);

         if (matchingCsvCard) {
             // Fusionner les données de l'API avec celles du CSV
             const mergedCard = {
                 ...apiCard,
                 ExLow: matchingCsvCard.ExLow,
                 FoilLow: matchingCsvCard.FoilLow,
                 Avg7: matchingCsvCard.Avg7,
                 MkmUrl: matchingCsvCard.MkmUrl
                 // Ajoutez d'autres attributs si nécessaire
             };
             console.log('Objet fusionné :', mergedCard);

             return mergedCard;
         } else {
             // Si aucune correspondance n'est trouvée, renvoyer les données de l'API telles quelles
             return apiCard;
         }
     });

      // Barre de Recherche
      document.getElementById('card-search').addEventListener('input', function(e) {
        const input = e.target.value.toLowerCase();
        const suggestionsContainer = document.getElementById('suggestions-container');
    
    
        suggestionsContainer.innerHTML = '';
    
        const filteredCards = cardsData.filter(card => {
            return card.Name &&
                (card.Name.toLowerCase().includes(input) || card.Set_Name.toLowerCase().includes(input)) &&
                !card.Set_Name.toLowerCase().includes('promo');
        });
    
        filteredCards.forEach(card => {
            const suggestionElement = document.createElement('div');
    
            const cardName = document.createElement('strong');
            cardName.textContent = card.Name;
            suggestionElement.appendChild(cardName);
    
            if (card.Name.includes('(V.2)')) {
                const extendedFoil = document.createElement('span');
                extendedFoil.textContent = ' Extended Foil';
                extendedFoil.style.fontWeight = 'bold'; // Texte en gras
                suggestionElement.appendChild(extendedFoil);
            }
    
            const expansionName = document.createElement('span');
            expansionName.textContent = ` // ${card.Set_Name}`;
            expansionName.style.color = 'red'; // Texte en rouge
            suggestionElement.appendChild(expansionName);
    
            suggestionElement.className = 'suggestion';
    
            suggestionElement.addEventListener('mouseenter', function () {
                // Changez la couleur de fond lorsque vous survolez la suggestion
                suggestionElement.style.backgroundColor = 'lightgray';
            });
        
            suggestionElement.addEventListener('mouseleave', function () {
                // Rétablissez la couleur de fond lorsque vous quittez la suggestion
                suggestionElement.style.backgroundColor = '';
            });
    
            suggestionElement.onclick = function() {
                // Mettez à jour selectedCardName avec le nom de la carte sélectionnée
                selectedCardName = card.Name;
                document.getElementById('card-search').value = selectedCardName;
                suggestionsContainer.innerHTML = '';
            };
            suggestionsContainer.appendChild(suggestionElement);
        });
    });

    })
    .catch(error => {
        console.error('Erreur lors de la récupération des données des cartes :', error);
    });
    }
});








function formatCardName(name) {
    return name.toLowerCase().replace(/ /g, '_');
    
}


let nextCardId = 1; // Initialisation de l'ID pour la première carte

function createCardElement(cardData, quantity, price, mkmUrl, isFoil, language) {
    quantity = parseInt(quantity, 10);
    price = parseFloat(price);
    const cardElement = document.createElement("div");
    cardElement.className = "card";

    const cardId = nextCardId++; // Définir l'ID de la carte

    // A remettre pour avoir le lien MKM de la carte

    const cardLink = document.createElement("a");
    cardLink.href = `https://www.cardmarket.com${mkmUrl}`;
    cardLink.target = "_blank";
    cardElement.appendChild(cardLink);

    // Utiliser l'URL de l'image en foil si la carte est en foil
    const imgUrl = cardData.Image;



    const imgElement = document.createElement("img");
    imgElement.src = imgUrl;
    imgElement.className = "card-image";
    imgElement.width = 186; // Ajustez la largeur souhaitée
    imgElement.height = 260; // Ajustez la hauteur souhaitée
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
        foilIcon.src = '/jpeg/etoile.png'; // Utilisez le chemin approprié
        foilIcon.alt = 'Foil';
        foilIcon.className = 'foil-icon';
        foilIcon.style.width = '50px'; // Ajustez la largeur selon vos besoins
        foilIcon.style.height = '50px'; // Ajustez la hauteur selon vos besoins
        cardInfoContainer.appendChild(foilIcon);
    }

    cardElement.appendChild(cardInfoContainer);

    const totalPrice = price * quantity;
    const originalPrice = price;

    // Appliquer un coefficient
    if (language === 'en') {
            price = price * 0.70;
    }

    // Appliquer un coefficient multiplicateur
    if (language === 'fr') {
            price = price * 0.75;
    }

    

    // Appliquer un coefficient de réduction pour les cartes en anglais et en français lorsqu'elles sont en "foil"
    if (isFoil && language === 'en') {
        price = originalPrice * 0.65; // 65% du prix foil pour les cartes en anglais
    } else if (isFoil && language === 'fr') {
        price = originalPrice * 0.70; // 75% du prix foil pour les cartes en français
    }
   

    if (['Rare', 'Enchanted', 'Legendary', 'SuperRare'].includes(cardData.Rarity) && price < 0.10) {
        price = 0.10;
    }

    const priceLabel = document.createElement("p");
    priceLabel.className = "card-price";
    priceLabel.textContent = `Price: ${price.toFixed(2)}€/p`;

    cardElement.appendChild(priceLabel);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-sm delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        // Supprimer la carte lorsqu'on clique sur le bouton "Delete"
        cardContainer.removeChild(cardElement);
        removeFromCardList(cardId); // Utilisez l'ID de la carte pour la suppression
        updateTotalPrice(); // Appeler updateTotalPrice après la suppression
    });

    cardElement.appendChild(deleteButton);

        // Ajoutez la carte à la liste des cartes
        addToCardList(cardId, selectedCardName, quantity, price, isFoil, language);

    return cardElement;
}

function addToCardList(cardId, name, quantity, price, isFoil, language) {
    const existingCard = cardList.find(card => card.cardId === cardId);

    if (existingCard) {
        // Si la carte existe déjà, mettez à jour la quantité
        existingCard.quantity += quantity;
    } else {
        // Sinon, ajoutez une nouvelle entrée à la liste avec l'ID
        cardList.push({ cardId, name, quantity, price, isFoil, language });
    }
}

function removeFromCardList(cardId) {
    const indexToRemove = cardList.findIndex(card => card.cardId === cardId);

    if (indexToRemove !== -1) {
        // Supprimez l'élément de la liste
        cardList.splice(indexToRemove, 1);
    }
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

   // Utilisez les données du fetch "all" au lieu du fetch "fuzzy"
   const selectedCard = cardsData.find(card => card.Name === cardName);

   if (!selectedCard) {
       alert('Carte non trouvée.');
       return;
   }

   const price = isFoil ? selectedCard.FoilLow : selectedCard.ExLow || 0;

   // Utilisez les données du fetch "all" pour créer la carte
   const cardContainer = document.getElementById('cardGrid');
   const cardElement = createCardElement(selectedCard, quantity, price, selectedCard.MkmUrl, isFoil, language);

   // Insérer la nouvelle carte avant le premier élément enfant de cardContainer
   cardContainer.insertBefore(cardElement, cardContainer.firstChild);

   updateTotalPrice(); // Appeler updateTotalPrice après l'ajout de la carte
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

    return totalCost;  // Ajoutez cette ligne pour renvoyer la valeur du coût total
}

function updateTotalPrice() {
    const totalCost = calculateTotalPrice();

    // Récupérez le bouton "Save the List"
    const saveListButton = document.getElementById('save-list');

    // Vérifiez s'il y a des cartes à l'écran
    const cardElements = document.querySelectorAll('.card');
    const isCardsPresent = cardElements.length > 0;

    // Affichez ou masquez le bouton en fonction de la présence de cartes
    saveListButton.style.display = isCardsPresent ? 'inline-block' : 'none';

    return totalCost;  // Ajoutez cette ligne pour renvoyer la valeur du coût total
}

const flagUrls = {
    'en': 'https://flagsapi.com/GB/shiny/64.png',
    'fr': 'https://flagsapi.com/FR/shiny/64.png',
    // Ajoutez d'autres correspondances ici
};

function getFlagImageUrl(languageCode) {
    return flagUrls[languageCode] || 'default_flag_url'; // URL par défaut si le code de langue n'est pas trouvé
}



function saveCardList() {
    const cardListText = cardList.map(card => `${card.name} - Quantity: ${card.quantity}, Price: ${card.price.toFixed(2)}€, Language: ${card.language}, Foil: ${card.isFoil ? 'Yes' : 'No'}`).join('\n');
    
    // Calculer le total et l'ajouter au texte
    const totalCost = calculateTotalPrice();
    const textWithTotal = `${cardListText}\n\nTotal Price: ${totalCost.toFixed(2)}€`;

    const blob = new Blob([textWithTotal], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'card_list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

document.getElementById('save-list').addEventListener('click', saveCardList);

updateTotalPrice();
