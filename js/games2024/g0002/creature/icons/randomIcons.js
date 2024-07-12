// js/randomicons.js
function createRandomIcons() {
    const icons = [];
    data.phyla.forEach(phylum => {
        phylum.creatures.forEach(creature => {
            creature.pictures.forEach(picture => {
                icons.push(picture.url);
            });
        });
    });
    return icons;
}

function createIconElement(url) {
    const img = document.createElement('img');
    img.src = url;
    img.classList.add('microbe-icon');
    img.style.position = 'absolute';
    img.style.left = `${Math.random() * 100}vw`;
    img.style.top = `${Math.random() * 100}vh`;
    document.body.appendChild(img);

    img.animate([
        { transform: 'translateY(0px)' },
        { transform: `translateY(${Math.random() * 10 - 5}px)` }
    ], {
        duration: 60000,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
    });

    return img;
}
