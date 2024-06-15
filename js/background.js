// background.js

function setRandomBackground() {
    const backgrounds = backgroundData.backgrounds;
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    const selectedBackground = backgrounds[randomIndex];
    document.body.style.backgroundImage = `url(${selectedBackground})`;
    document.body.style.backgroundSize = 'contain';  // Ensure the entire image fits within the viewport
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center';
}

document.addEventListener('DOMContentLoaded', () => {
    setRandomBackground();
});
