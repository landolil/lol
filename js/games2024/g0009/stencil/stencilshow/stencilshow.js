// js/stencilshow.js

const stencilshowButton = document.getElementById('stencilshow-button');
const stopstencilshowButton = document.getElementById('stop-stencilshow-button');
const stencil_mainImage = document.getElementById('main-image');
const stencil_details = document.getElementById('stencil_details');
let stencilshowInterval;

function getRandomStencilItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function createRandomStencilPlaylist() {
    const playlist = [];
    stencil_data.STENCIL.forEach(english => {
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

function startRandomstencilshow() {
    const stencil_playlist = createRandomStencilPlaylist();
    function showNextStencil() {
        const randomStencil = getRandomStencilItem(stencil_playlist);
        stencil_mainImage.src = randomStencil.url;
        stencil_mainImage.alt = randomStencil.title;
        stencil_details.innerHTML = `
            <h2>${randomStencil.title}</h2>
            <p><strong>Design Style:</strong> ${randomStencil.parentName}</p>
        `;
        stencilshowInterval = setTimeout(showNextStencil, 3000); // 3 seconds interval
    }
    showNextStencil(); // Start the loop
}

function stopRandomstencilshow() {
    clearTimeout(stencilshowInterval);
}

stencilshowButton.addEventListener('click', startRandomStencilshow);
stopStencilshowButton.addEventListener('click', stopRandomStencilshow);
