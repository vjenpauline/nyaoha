const plantService = {
    async getAllPlants() {
        try {
            const response = await fetch('https://nyaoha.onrender.com/api/plants');
            if (!response.ok) {
                throw new Error('Failed to fetch plants');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching plants:', error);
            throw error;
        }
    },

    async searchPlants(query, filters = {}) {
        try {
            const params = new URLSearchParams({
                query: query,
                ...filters
            });
            const response = await fetch(`https://nyaoha.onrender.com/api/plants${params}`);
            if (!response.ok) {
                throw new Error('Failed to search plants');
            }
            return await response.json();
        } catch (error) {
            console.error('Error searching plants:', error);
            throw error;
        }
    },

    async getPlantById(id) {
        try {
            const response = await fetch(`https://nyaoha.onrender.com/api/plants/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch plant details');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching plant details:', error);
            throw error;
        }
    },

    filterByPetSafety(pets = []) {
        return async (plants) => {
            if (!pets.length) return plants;
            return plants.filter(plant => {
                if (!plant.toxicity || !plant.toxicity.toxicTo) return true;
                return !pets.some(pet => plant.toxicity.toxicTo.includes(pet));
            });
        };
    }
};

const grid = document.getElementById("plantGrid");
const sortDropdown = document.getElementById("sortDropdown");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/plants'
    : 'https://nyaoha.onrender.com/api/plants';

const animalTypes = ["dogs", "cats", "horses", "reptiles", "birds", "fish", "small-mammals"];
const severityLevels = ["mild", "moderate", "severe", "critical"];

let plantData = [];
let filteredData = [];
let currentIndex = 0;
const PLANTS_PER_PAGE = 12;

let userFavorites = [];

function syncFavoritesFromStorage() {
  try {
    const favs = JSON.parse(localStorage.getItem('favorites'));
    if (Array.isArray(favs)) userFavorites = favs;
  } catch {}
}

function saveFavoritesToStorage() {
  localStorage.setItem('favorites', JSON.stringify(userFavorites));
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const animalFilters = document.getElementById("animalFilters");
  const severityFilters = document.getElementById("severityFilters");

  if (!searchInput) {
    console.error("searchInput element not found");
    return;
  }

  if (!grid) {
    console.error("plantGrid element not found");
    return;
  }

  if (animalFilters) {
    animalTypes.forEach(type => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${type}" class="animal-checkbox"> ${type}`;
      animalFilters.appendChild(label);
    });
  }

  if (severityFilters) {
    severityLevels.forEach(level => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${level}" class="severity-checkbox"> ${level}`;
      severityFilters.appendChild(label);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const searchTerm = params.get("search");
  if (searchTerm) {
    searchInput.value = searchTerm;
  }

  async function fetchPlants() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to load plant data");
      plantData = await res.json();
      applyFilters();
    } catch (err) {
      grid.innerHTML = `<p>Error loading data. Check your server: ${API_URL}</p>`;
      console.error("Error loading plants:", err);
    }
  }

  (async () => {
    try {
      await fetchFavorites();
      saveFavoritesToStorage();
    } catch (err) {
      syncFavoritesFromStorage();
    } finally {
      await fetchPlants();
    }
  })();
});

// sync and save favorites to local storage
async function fetchFavorites() {
  const token = localStorage.getItem("token");
  if (!token) {
    userFavorites = [];
    saveFavoritesToStorage();
    return;
  }
  try {
    const res = await fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Unauthorized or failed fetch");
    const favs = await res.json();
    userFavorites = favs.map(p => p.pid || p.id || p._id);
    saveFavoritesToStorage();
  } catch (err) {
    syncFavoritesFromStorage();
  }
}

// fetch and render plants, handle filters and favorites
async function toggleFavorite(id, iconEl) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in to add favorites.");
    return;
  }

  if (userFavorites.includes(id)) {
    userFavorites = userFavorites.filter(fav => fav !== id);
    iconEl.classList.remove('favorited');
  } else {
    userFavorites.push(id);
    iconEl.classList.add('favorited');
  }
  saveFavoritesToStorage();
  try {
    const res = await fetch(`/api/favorites/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to toggle favorite");
    const data = await res.json();
    userFavorites = data.favorites;
    saveFavoritesToStorage();
    applyFilters();
  } catch (err) {

    if (userFavorites.includes(id)) {
      userFavorites = userFavorites.filter(fav => fav !== id);
      iconEl.classList.remove('favorited');
    } else {
      userFavorites.push(id);
      iconEl.classList.add('favorited');
    }
    saveFavoritesToStorage();
    alert("Failed to update favorite");
  }
}

// render plant cards
function renderPlants(plants, append = false) {
  if (!append) grid.innerHTML = "";
  syncFavoritesFromStorage();
  plants.forEach(plant => {
    const id = plant.pid || plant.id || plant._id;
    const common = plant.common?.[0]?.name || "Unnamed Plant";
    const imgUrl = plant.images?.[0]?.source_url;
    const scientific = plant.name || "";
    const severity = plant.severity?.label || "Unknown";
    const severitySlug = plant.severity?.slug || "";
    const symptoms = plant.symptoms?.map(s => s.name).join(", ") || "None listed";
    const link = plant.wikipedia_url || "#";
    const animals = plant.animals?.map(a => `<span class='tag'>${a}</span>`).join(" ") || "";

    const isFavorited = userFavorites && userFavorites.includes && id ? userFavorites.includes(id) : false;

    const card = document.createElement("div");
    card.className = "plant-card animate-in";
    card.addEventListener("animationend", () => {
      card.classList.remove("animate-in");
    });

    card.innerHTML = `
      <div class="card-header">
        <img src="${imgUrl}" alt="${common}" onerror="this.onerror=null; this.src='pictures/background/unavailable.jpg';" class="plant-image" />
        <span class="severity-badge ${severitySlug}">${severity}</span>
        <span class="favorite-icon ${isFavorited ? 'favorited' : ''}" data-id="${id}">♡</span>
      </div>
      <div class="card-content">
        <h3>${common}</h3>
        <em>${scientific}</em>
        <div class="animal-tags">${animals}</div>
        <p><strong>Symptoms:</strong> ${symptoms}</p>
      </div>
      <button class="view-button">
        <a href="${link}" target="_blank">View Details</a>
      </button>
    `;

    const favoriteBtn = card.querySelector(".favorite-icon");
    if (isFavorited) favoriteBtn.classList.add('favorited');
    else favoriteBtn.classList.remove('favorited');
    favoriteBtn.addEventListener("click", () => toggleFavorite(id, favoriteBtn));
    grid.appendChild(card);
  });
}

// apply filters and sorting
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const term = searchInput ? searchInput.value.toLowerCase() : '';
  const sort = sortDropdown.value;
  const selectedAnimals = Array.from(document.querySelectorAll(".animal-checkbox:checked")).map(c => c.value);
  const selectedSeverities = Array.from(document.querySelectorAll(".severity-checkbox:checked")).map(c => c.value);

  filteredData = plantData.filter(p => {
    const name = p.common?.[0]?.name?.toLowerCase() || "";
    const matchesSearch = name.includes(term);
    const plantAnimals = Array.isArray(p.animals) ? p.animals : [];
    const matchesAnimal = selectedAnimals.length === 0 ||
      (plantAnimals.length === selectedAnimals.length &&
        selectedAnimals.every(animal => plantAnimals.includes(animal)));
    const matchesSeverity = selectedSeverities.length === 0 ||
      selectedSeverities.includes(p.severity?.slug);
    return matchesSearch && matchesAnimal && matchesSeverity;
  });

  filteredData.sort((a, b) => {
    const nameA = a.common?.[0]?.name || "";
    const nameB = b.common?.[0]?.name || "";
    return sort === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  currentIndex = 0;
  renderNextPage();
}

// render next page of plants
function renderNextPage() {
  const nextPlants = filteredData.slice(currentIndex, currentIndex + PLANTS_PER_PAGE);
  renderPlants(nextPlants, currentIndex !== 0);
  currentIndex += PLANTS_PER_PAGE;

  if (currentIndex < filteredData.length) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

// event listeners for sorting, filtering, and loading more
sortDropdown.addEventListener("change", applyFilters);
document.addEventListener("change", applyFilters);
loadMoreBtn.addEventListener("click", renderNextPage);
