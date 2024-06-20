const MAX_BUBBLES = 250; // You can change this value later if needed
const BUBBLE_SVG_URL = 'images/detailed_bubble.svg'; // Path to your SVG file

function createFloatingBubbles(maxBubbles = MAX_BUBBLES) {
    const bubblesContainer = document.createElement('div');
    bubblesContainer.classList.add('floating-bubbles');
    bubblesContainer.style.position = 'absolute';
    bubblesContainer.style.top = '0';
    bubblesContainer.style.left = '0';
    bubblesContainer.style.width = '100%';
    bubblesContainer.style.height = '100%';

    bubblesContainer.style.zIndex = '-2'; // Ensure it stays in the background
    document.body.appendChild(bubblesContainer);

    for (let i = 0; i < maxBubbles; i++) {
        const bubble = document.createElement('img');
        bubble.src = BUBBLE_SVG_URL;
        bubble.classList.add('bubble');

        const position = getRandomPosition(window.innerWidth - 3, window.innerHeight - 3);
        bubble.style.left = `${position.x}px`;
        bubble.style.top = `${position.y}px`;
        bubble.style.opacity = '0'; // Start with full transparency
        bubble.style.transition = 'opacity 1s ease-in-out'; // Add transition for fade-in/out

        // Add event listeners for load and error
        bubble.addEventListener('load', () => {
            bubblesContainer.appendChild(bubble);
            bubble.style.opacity = '.97'; // Fade-in to 97% opacity

            // Assign random hues of blue
            const hue = Math.random() * 360;
            bubble.style.filter = `hue-rotate(${hue}deg)`;
        });

        bubble.addEventListener('error', () => {
            console.error(`Failed to load image: ${BUBBLE_SVG_URL}`);
            bubble.remove();
        });

        const duration = Math.random() * 445 + 5; // 5 to 50 seconds
        const swayDuration = Math.random() * 5 + 2; // 2 to 7 seconds
        const swayDistance = Math.random() * 20 + 10; // 10 to 30 pixels

        bubble.style.animation = `moveUp ${duration}s linear infinite, sway ${swayDuration}s ease-in-out infinite, sizeChange ${swayDuration}s ease-in-out infinite`;
        bubble.style.setProperty('--sway-distance', `${swayDistance}px`);

        // Ensure the bubble reappears when it leaves the screen
        bubble.addEventListener('animationiteration', () => {
            bubble.style.opacity = '0'; // Fade-out before repositioning
            setTimeout(() => {
                const newPosition = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
                bubble.style.left = `${newPosition.x}px`;
                bubble.style.top = `${newPosition.y}px`; // Randomly reposition on the screen
                bubble.style.opacity = '.97'; // Fade-in after repositioning
            }, 1000); // Match fade-out transition time
        });

        // Random disappearance and reappearance, ensuring they stay on screen for at least 20 seconds
        setTimeout(() => {
            setInterval(() => {
                bubble.style.opacity = '0'; // Fade-out
                setTimeout(() => {
                    bubble.style.opacity = '.97'; // Fade-in
                }, Math.random() * 5000 + 1000); // Reappear after 1 to 6 seconds
            }, Math.random() * 20000 + 5000); // Every 5 to 25 seconds
        }, 60000); // Start random disappearance after 20 seconds
    }
}

function getRandomPosition(maxWidth, maxHeight) {
    const randomX = Math.floor(Math.random() * maxWidth);
    const randomY = Math.floor(Math.random() * maxHeight);
    return { x: randomX, y: randomY };
}

document.addEventListener('DOMContentLoaded', () => {
    createFloatingBubbles();
});
