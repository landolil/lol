const MAX_ICONS = 600; // You can change this value later if needed
const RIVER_DURATION = 60000; // 1 minute for a full 360-degree rotation

function createSpinningIcons(imageUrls, maxIcons = MAX_ICONS) {
    const movingIconsContainer = document.createElement('div');
    movingIconsContainer.classList.add('moving-icons');
    movingIconsContainer.style.position = 'absolute';
    movingIconsContainer.style.top = '0';
    movingIconsContainer.style.left = '0';
    movingIconsContainer.style.width = '100%';
    movingIconsContainer.style.height = '100%';
    movingIconsContainer.style.zIndex = '-1'; // Ensure it stays in the background
    document.body.appendChild(movingIconsContainer);

    const selectedIcons = imageUrls.slice(0, maxIcons);
    selectedIcons.forEach(url => {
        const iconUrl = url.replace(/\.(jpg|jpeg)$/i, '_icon.jpg');
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.classList.add('icon');

        icon.addEventListener('load', () => {
            icon.style.filter = 'brightness(0) invert(1)'; // Invert colors
            icon.style.mixBlendMode = 'screen'; // Apply blend mode to make white transparent
            movingIconsContainer.appendChild(icon);
        });

        icon.addEventListener('error', () => {
            console.error(`Failed to load image: ${iconUrl}`);
            icon.remove();
        });

        const duration = Math.random() * 5 + 5; // 5 to 10 seconds
        icon.style.animation = `move ${duration}s ease-in-out infinite`;

        const position = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
        icon.style.left = `${position.x}px`;
        icon.style.top = `${position.y}px`;

        if (Math.random() < 0.1) {
            setInterval(() => {
                icon.style.transform = `scale(${1 + Math.random() * 1})`;
            }, 2000);
        }
    });

    // Start the river current effect
    startRiverCurrent(movingIconsContainer);
}

function getRandomPosition(maxWidth, maxHeight) {
    const randomX = Math.floor(Math.random() * maxWidth);
    const randomY = Math.floor(Math.random() * maxHeight);
    return { x: randomX, y: randomY };
}

function startRiverCurrent(container) {
    let angle = 0;
    setInterval(() => {
        angle = (angle + 1) % 360; // Increment angle and keep it within 0-359 degrees
        const radian = (angle * Math.PI) / 180; // Convert angle to radians

        // Calculate the new position for each icon based on the current angle
        container.childNodes.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const x = rect.left + rect.width / 2 - centerX;
            const y = rect.top + rect.height / 2 - centerY;

            const newX = x * Math.cos(radian) - y * Math.sin(radian) + centerX;
            const newY = x * Math.sin(radian) + y * Math.cos(radian) + centerY;

            icon.style.left = `${newX - rect.width / 2}px`;
            icon.style.top = `${newY - rect.height / 2}px`;
        });
    }, RIVER_DURATION / 360); // Update position every (1/360)th of the RIVER_DURATION
}

// Add CSS for horizontal movement
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
    @keyframes move {
        0%, 100% {
            transform: translate(0, 0) rotate(0);
        }
        25% {
            transform: translateY(10px) translateX(-10px);
        }
        50% {
            transform: translateY(20px) translateX(10px) rotate(10deg);
        }
        75% {
            transform: translateY(10px) translateX(-10px);
        }
    }
`, styleSheet.cssRules.length);
