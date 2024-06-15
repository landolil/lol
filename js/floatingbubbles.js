const MAX_BUBBLES = 400; // You can change this value later if needed

function createFloatingBubbles(imageUrls, maxBubbles = MAX_BUBBLES) {
    const bubblesContainer = document.createElement('div');
    bubblesContainer.classList.add('floating-bubbles');
    bubblesContainer.style.position = 'absolute';
    bubblesContainer.style.top = '0';
    bubblesContainer.style.left = '0';
    bubblesContainer.style.width = '100%';
    bubblesContainer.style.height = '100%';
    bubblesContainer.style.zIndex = '-1'; // Ensure it stays in the background
    document.body.appendChild(bubblesContainer);

    const selectedBubbles = imageUrls.slice(0, maxBubbles);
    selectedBubbles.forEach(url => {
        const bubble = document.createElement('img');
        bubble.src = url;
        bubble.classList.add('bubble');

        const position = getRandomPosition(window.innerWidth - 10, window.innerHeight - 10);
        bubble.style.left = `${position.x}px`;
        bubble.style.top = `${position.y}px`;
        bubble.style.opacity = '0'; // Start with full transparency
        bubble.style.transition = 'opacity 1s ease-in-out'; // Add transition for fade-in/out

        // Add event listeners for load and error
        bubble.addEventListener('load', () => {
            bubblesContainer.appendChild(bubble);
            bubble.style.opacity = '.97'; // Fade-in to 97% opacity
        });

        bubble.addEventListener('error', () => {
            console.error(`Failed to load image: ${url}`);
            bubble.remove();
        });

        const duration = Math.random() * 45 + 5; // 5 to 50 seconds
        bubble.style.animation = `moveUp ${duration}s linear infinite, sway 3s ease-in-out infinite`;

        // Ensure the bubble reappears when it leaves the screen
        bubble.addEventListener('animationiteration', () => {
            bubble.style.opacity = '.05'; // Fade-out before repositioning
            setTimeout(() => {
                const newPosition = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
                bubble.style.left = `${newPosition.x}px`;
                bubble.style.top = `${window.innerHeight + 50}px`; // Start from just below the viewable area
                bubble.style.opacity = '0.8'; // Fade-in after repositioning
            }, 1000); // Match fade-out transition time
        });
    });
}

function getRandomPosition(maxWidth, maxHeight) {
    const randomX = Math.floor(Math.random() * maxWidth);
    const randomY = Math.floor(Math.random() * maxHeight);
    return { x: randomX, y: randomY };
}

document.addEventListener('DOMContentLoaded', () => {
    createFloatingBubbles(bubbleImages);
});
