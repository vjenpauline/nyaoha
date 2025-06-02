// Plant Database Service
const plantService = {
    async getAllPlants() {
        try {
            const response = await fetch('https://plantsm.art/static/api/plants.json');
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
            const response = await fetch(`https://plantsm.art/static/api/plants.json?${params}`);
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
            const response = await fetch(`https://plantsm.art/static/api/plants/${id}.json`);
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
const searchInput = document.getElementById("searchInput");
const sortDropdown = document.getElementById("sortDropdown");
const animalFilters = document.getElementById("animalFilters");
const severityFilters = document.getElementById("severityFilters");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/plants.json'
    : 'https://nyaoha.onrender.com/api/plants.json';

const animalTypes = ["dogs", "cats", "horses", "reptiles", "birds", "fish", "small-mammals"];
const severityLevels = ["mild", "moderate", "severe", "critical"];

let plantData = [];
let filteredData = [];
let currentIndex = 0;
const PLANTS_PER_PAGE = 12;

// Create animal filter checkboxes (allowing multiple selections)
animalTypes.forEach(type => {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${type}" class="animal-checkbox"> ${type}`;
  animalFilters.appendChild(label);
});

// Create severity filter checkboxes (allowing multiple selections)
severityLevels.forEach(level => {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${level}" class="severity-checkbox"> ${level}`;
  severityFilters.appendChild(label);
});

async function fetchPlants() {
  try {
    const res = await fetch(API_URL);
    plantData = await res.json();
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<p>Error loading data. Check your server: ${API_URL}</p>`;
    console.error(err);
  }
}

function renderPlants(plants, append = false) {
  if (!append) grid.innerHTML = "";

  plants.forEach(plant => {
    const common = plant.common?.[0]?.name || "Unnamed Plant";
    const img = (plant.images && plant.images.length > 0 && plant.images[0].source_url) ? plant.images[0].source_url : "pictures/background/image.png";
    const scientific = plant.name || "";
    const severity = plant.severity?.label || "Unknown";
    const severitySlug = plant.severity?.slug || "";
    const symptoms = plant.symptoms?.map(s => s.name).join(", ") || "None listed";
    const link = plant.wikipedia_url || "#";
    const animals = plant.animals?.map(a => `<span class='tag'>${a}</span>`).join(" ") || "";

    const card = document.createElement("div");
    card.className = "plant-card";
    card.innerHTML = `
      <div class="card-header">
        <span class="severity-badge ${severitySlug}">${severity}</span>
        <span class="favorite-icon">♡</span>
        <img src="${img}" alt="${common}" />
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
    grid.appendChild(card);
  });
}

function applyFilters() {
  const term = searchInput.value.toLowerCase();
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

searchInput.addEventListener("input", applyFilters);
sortDropdown.addEventListener("change", applyFilters);
document.addEventListener("change", applyFilters);
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const searchTerm = params.get("search");
  if (searchTerm) {
    searchInput.value = searchTerm;
  }
  fetchPlants();
});

loadMoreBtn.addEventListener("click", renderNextPage);
