const MAX_ICONS = 400; // You can change this value later if needed

function createMovingIcons(imageUrls, maxIcons = MAX_ICONS) {
    const movingIconsContainer = document.createElement('div');
    movingIconsContainer.classList.add('moving-icons');
    movingIconsContainer.style.position = 'absolute';
    movingIconsContainer.style.top = '0';
    movingIconsContainer.style.left = '0';
    movingIconsContainer.style.width = '100%';
    movingIconsContainer.style.height = '100%';
    movingIconsContainer.style.zIndex = '-4'; // Ensure it stays in the background
    document.body.appendChild(movingIconsContainer);

    const selectedIcons = imageUrls.slice(0, maxIcons);
    selectedIcons.forEach(url => {
        const iconUrl = url.replace(/\.(jpg|jpeg)$/i, '_icon.png');
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.classList.add('icon');

        const position = getRandomPosition(window.innerWidth - 10, window.innerHeight - 10);
        icon.style.left = `${position.x}px`;
        icon.style.top = `${position.y}px`;
        icon.style.opacity = '0'; // Start with full transparency
        icon.style.transition = 'opacity 1s ease-in-out'; // Add transition for fade-in/out

        // Add event listeners for load and error
        icon.addEventListener('load', () => {
            movingIconsContainer.appendChild(icon);
            icon.style.opacity = '.97'; // Fade-in to 97% opacity
        });

        icon.addEventListener('error', () => {
            console.error(`Failed to load image: ${iconUrl}`);
            icon.remove();
        });

        const duration = Math.random() * 45 + 5; // 5 to 50 seconds
        icon.style.animation = `move ${duration}s ease-in-out infinite`;

        // Ensure the icon reappears when it leaves the screen
        icon.addEventListener('animationiteration', () => {
            icon.style.opacity = '.05'; // Fade-out before repositioning
            setTimeout(() => {
                const newPosition = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
                icon.style.left = `${newPosition.x}px`;
                icon.style.top = `${newPosition.y}px`;
                icon.style.opacity = '0.8'; // Fade-in after repositioning
            }, 10000); // Match fade-out transition time
        });

        if (Math.random() < 0.9) {
            setInterval(() => {
                icon.style.transform = `scale(${1 + Math.random() * 3})`;
            }, 2000);
        }
    });
}

function getRandomPosition(maxWidth, maxHeight) {
    const randomX = Math.floor(Math.random() * maxWidth);
    const randomY = Math.floor(Math.random() * maxHeight);
    return { x: randomX, y: randomY };
}
