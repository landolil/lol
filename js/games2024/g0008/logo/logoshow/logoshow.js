// js/logoshow.js

const logoshowButton = document.getElementById('logoshow-button');
const stopLogoshowButton = document.getElementById('stop-logoshow-button');
const logo_mainImage = document.getElementById('main-image');
const logo_details = document.getElementById('logo_details');
let logoshowInterval;

function getRandomLogoItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function createRandomLogoPlaylist() {
    const playlist = [];
    logo_data.ENGLISH.forEach(english => {
        english.COLOR_STYLE.forEach(colorStyle => {
            colorStyle.DESIGN_STYLE.forEach(designStyle => {
                designStyle.images.forEach(image => {
                    playlist.push({
                        ...image,
                        parentName: designStyle.name
                    });
                });
            });
        });
    });
    return playlist;
}

function startRandomLogoshow() {
    const logo_playlist = createRandomLogoPlaylist();
    function showNextLogo() {
        const randomLogo = getRandomLogoItem(logo_playlist);
        logo_mainImage.src = randomLogo.url;
        logo_mainImage.alt = randomLogo.title;
        logo_details.innerHTML = `
            <h2>${randomLogo.title}</h2>
            <p><strong>Design Style:</strong> ${randomLogo.parentName}</p>
        `;
        logoshowInterval = setTimeout(showNextLogo, 3000); // 3 seconds interval
    }
    showNextLogo(); // Start the loop
}

function stopRandomLogoshow() {
    clearTimeout(logoshowInterval);
}

logoshowButton.addEventListener('click', startRandomLogoshow);
stopLogoshowButton.addEventListener('click', stopRandomLogoshow);
