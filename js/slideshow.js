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
    const mainImage = document.getElementById('main-image');
    const details = document.getElementById('details');
    
    mainImage.src = randomPicture.url;
    mainImage.alt = randomPicture.title;
    details.innerHTML = `<center><h1>Tardigradia<br>land 'o' lil</center></h1><h2>${randomPicture.name}</h2><p>${randomPicture.phyla}</p><p><strong>Phylum:</strong> ${randomPicture.phylum}</p>`;
    
    slideshowTimeout = setTimeout(startRandomSlideshow, 3000); // 3 seconds interval
}

function stopRandomSlideshow() {
    clearTimeout(slideshowTimeout);
}

document.addEventListener('DOMContentLoaded', () => {
    const slideshowButton = document.getElementById('slideshow-button');
    const stopSlideshowButton = document.getElementById('stop-slideshow-button');
    
    slideshowButton.addEventListener('click', startRandomSlideshow);
    stopSlideshowButton.addEventListener('click', stopRandomSlideshow);
});
