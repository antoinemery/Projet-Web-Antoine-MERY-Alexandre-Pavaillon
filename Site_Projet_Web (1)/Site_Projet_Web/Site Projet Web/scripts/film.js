const API_KEY = 'dcb0bf0f2cb36fa96eab0fadcdd9d7ce';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Fonction pour obtenir les détails d'un film en essayant en français puis en anglais
async function fetchMovieDetails(movieId) {
    const apiUrlFr = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=fr-FR`;
    const apiUrlEn = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;

    try {
        let response = await fetch(apiUrlFr);
        let data = await response.json();

        // Si le synopsis en français n'est pas disponible, compléter avec les données en anglais
        if (!data.overview) {
            const responseEn = await fetch(apiUrlEn);
            const dataEn = await responseEn.json();
            data.overview = dataEn.overview;
        }

        console.log('Movie details:', data); // Log les détails du film
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du film :', error);
    }
}

// Fonction pour afficher les détails du film
function displayMovieDetails(movie) {
    const filmContainer = document.getElementById('film-container');
    filmContainer.innerHTML = '';

    const moviePoster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'path/to/default_image.jpg';
    const genres = movie.genres.map(genre => genre.name).join(', ');
    const synopsis = movie.overview || '';  // Afficher vide si non disponible
    const duration = movie.runtime ? `${movie.runtime} minutes` : '';

    filmContainer.innerHTML = `
        <div class="film-detail">
            <img src="${moviePoster}" alt="Affiche du film">
            <div class="film-detail-content">
                <h1>${movie.title}</h1>
                <p><strong>Année de sortie:</strong> ${movie.release_date.split('-')[0]}</p>
                <p><strong>Genres:</strong> ${genres}</p>
                <p><strong>Synopsis:</strong> ${synopsis}</p>
                <p><strong>Note:</strong> ${Math.round(movie.vote_average)} / 10</p>
                <p><strong>Durée:</strong> ${duration}</p>
            </div>
        </div>
    `;
}

// Fonction principale pour récupérer et afficher les détails du film
async function loadMovieDetails() {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    if (movieId) {
        const movie = await fetchMovieDetails(movieId);
        displayMovieDetails(movie);
    } else {
        console.error('Aucun ID de film fourni dans l\'URL.');
    }
}

// Charger les détails du film lorsque la page est chargée
document.addEventListener('DOMContentLoaded', loadMovieDetails);
