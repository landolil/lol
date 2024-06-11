
// js/slideshow.js

const slideshowButton = document.getElementById('slideshow-button');
const stopSlideshowButton = document.getElementById('stop-slideshow-button');
let slideshowTimeout;

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function createRandomPlaylist() {
    const playlist = [];
    data.phyla.forEach(phylum => {
        phylum.creatures.forEach(creature => {
            creature.pictures.forEach(picture => {
                playlist.push(picture);
            });
        });
    });
    return playlist;
}

function startRandomSlideshow() {
    const playlist = createRandomPlaylist();
    const randomPicture = getRandomItem(playlist);
    mainImage.src = randomPicture.url;
    mainImage.alt = randomPicture.title;
    details.innerHTML = `<center><h1>Tardigradia<br>land'o'lil<br></center></h1><h2>${randomPicture.title}</h2>`;
	// <p>${randomPicture.description}</p>
    slideshowTimeout = setTimeout(startRandomSlideshow, 3000); // 3 seconds interval
}

function stopRandomSlideshow() {
    clearTimeout(slideshowTimeout);
}

slideshowButton.addEventListener('click', startRandomSlideshow);
stopSlideshowButton.addEventListener('click', stopRandomSlideshow);

