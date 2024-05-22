const API_KEY = 'dcb0bf0f2cb36fa96eab0fadcdd9d7ce';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let genresList = [];
let recentPage = 1;
let allPage = 1;
const perPage = 20;

// Fonction pour récupérer les genres de films depuis l'API TMDb
async function fetchGenres() {
    const apiUrl = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=fr-FR`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        genresList = data.genres;
        return genresList;
    } catch (error) {
        console.error('Erreur lors de la récupération des genres :', error);
    }
}

// Fonction pour obtenir les noms de genres à partir de leurs IDs
function getGenreNames(genreIds) {
    return genreIds.map(id => {
        const genre = genresList.find(g => g.id === id);
        return genre ? genre.name : '';
    }).join(', ');
}

// Fonction pour afficher les résultats de recherche
function displayResults(movies, containerId) {
    const resultsDiv = document.querySelector(`#${containerId} .grid-container`);
    resultsDiv.innerHTML = '';

    if (!movies || movies.length === 0) {
        resultsDiv.innerHTML = '<p>Aucun résultat trouvé.</p>';
        return;
    }

    for (const movie of movies) {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('film-tile');
        movieDiv.dataset.movieId = movie.id;

        const moviePoster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'path/to/default_image.jpg';
        const genreNames = getGenreNames(movie.genre_ids);

        movieDiv.innerHTML = `
            <img src="${moviePoster}" alt="Affiche du film">
            <h2>${movie.title}</h2>
            <p>Année de sortie: ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
            <p>Genre: ${genreNames}</p>
            <div class="rating">
                <span>&#9733;</span>
                <span>${Math.round(movie.vote_average)} / 10</span>
            </div>
        `;
        resultsDiv.appendChild(movieDiv);

        // Ajouter un écouteur d'événement pour rediriger vers la page des détails du film
        movieDiv.addEventListener('click', () => {
            const movieId = movieDiv.dataset.movieId;
            window.location.href = `film.html?id=${movieId}`;
        });
    }
}

// Fonction pour afficher la pagination
function displayPagination(containerId, paginationId, totalPages, currentPage, fetchFunction) {
    const paginationDiv = document.getElementById(paginationId);
    paginationDiv.innerHTML = '';

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    const prevPageLink = document.createElement('a');
    prevPageLink.href = '#';
    prevPageLink.innerHTML = '&laquo;';
    if (currentPage === 1) {
        prevPageLink.classList.add('disabled');
    } else {
        prevPageLink.addEventListener('click', (event) => {
            event.preventDefault();
            fetchFunction(currentPage - 1);
            window.scrollTo(0, 0);  // Scroll to top after page change
        });
    }
    paginationDiv.appendChild(prevPageLink);

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i === currentPage) pageLink.classList.add('active');
        pageLink.addEventListener('click', (event) => {
            event.preventDefault();
            fetchFunction(i);
            window.scrollTo(0, 0);  // Scroll to top after page change
        });
        paginationDiv.appendChild(pageLink);
    }

    const nextPageLink = document.createElement('a');
    nextPageLink.href = '#';
    nextPageLink.innerHTML = '&raquo;';
    if (currentPage === totalPages) {
        nextPageLink.classList.add('disabled');
    } else {
        nextPageLink.addEventListener('click', (event) => {
            event.preventDefault();
            fetchFunction(currentPage + 1);
            window.scrollTo(0, 0);  // Scroll to top after page change
        });
    }
    paginationDiv.appendChild(nextPageLink);
}

// Fonction pour récupérer les films récents
async function fetchRecentMovies(page = 1) {
    const apiUrl = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=fr-FR&page=${page}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        recentPage = page;
        displayResults(data.results, 'results-recent');
        displayPagination('results-recent', 'pagination-recent', data.total_pages, page, fetchRecentMovies);
    } catch (error) {
        console.error('Erreur lors de la récupération des films récents :', error);
    }
}

// Fonction pour récupérer les films de manière aléatoire
async function fetchRandomMovies(page = 1) {
    const apiUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${page}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayResults(data.results, 'results-all');
        displayPagination('results-all', 'pagination-all', data.total_pages, page, fetchRandomMovies);
    } catch (error) {
        console.error('Erreur lors de la récupération des films aléatoires :', error);
    }
}

// Fonction pour afficher les options de genre dans le select
async function populateGenres() {
    const genres = await fetchGenres();
    const genreSelect = document.getElementById('genreSelect');
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
}

// Appeler les fonctions pour peupler les genres et afficher des films populaires lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    populateGenres();
    fetchRecentMovies(); // Appel pour afficher les films récents
    fetchRandomMovies(); // Appel pour afficher les films aléatoires dans les suggestions
});

// Gestionnaire d'événements pour le formulaire de recherche
document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = document.getElementById('searchInput').value;
    const year = document.getElementById('yearInput').value;
    const genre = document.getElementById('genreSelect').value;
    const rating = document.getElementById('ratingSelect').value;

    if (year && (year < 1900 || year > new Date().getFullYear())) {
        alert("Veuillez entrer une année valide à partir de 1900 jusqu'à l'année actuelle.");
        return;
    }

    searchMovies(query, year, genre, rating, 1);
});

// Fonction pour rechercher des films avec les filtres
async function searchMovies(query, year, genre, rating, page = 1) {
    let apiUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&page=${page}`;
    if (query) apiUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&page=${page}`;
    if (year) apiUrl += `&primary_release_year=${year}`;
    if (genre) apiUrl += `&with_genres=${genre}`;
    if (rating === 'high') apiUrl += `&sort_by=vote_average.desc`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayResults(data.results, 'results-recent');
        displayPagination('results-recent', 'pagination-recent', data.total_pages, page, (page) => {
            searchMovies(query, year, genre, rating, page);
            window.scrollTo(0, 0);  // Scroll to top after page change
        });
        // Mettre à jour le titre de la section de résultats avec le terme de recherche
        document.getElementById('results-title').textContent = query ? `Résultats pour "${query}"` : 'Récents';
    } catch (error) {
        console.error('Erreur lors de la recherche de films :', error);
    }
}

// Menu burger
const menuToggle = document.getElementById('menu-toggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('active');
});

document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
        menu.classList.remove('active');
    }
});
