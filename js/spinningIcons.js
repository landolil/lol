const MAX_ICONS = 600; // You can change this value later if needed
const RIVER_DURATION = 20000; // Total duration for the full cycle: 5 seconds regular, 15 seconds slow down and speed up
const REGULAR_SPIN_DURATION = 5000; // 5 seconds for regular spin
const SLOWDOWN_DURATION = 7500; // 7.5 seconds to slow down
const SPEEDUP_DURATION = 7500; // 7.5 seconds to speed up

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
        const iconUrl = url.replace(/\.(jpg|jpeg)$/i, '_icon.png');
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.classList.add('icon');

        const position = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
        icon.style.left = `${position.x}px`;
        icon.style.top = `${position.y}px`;
        icon.style.opacity = '0'; // Start with full transparency
        icon.style.transition = 'opacity 1s ease-in-out'; // Add transition for fade-in/out

        // Add event listeners for load and error
        icon.addEventListener('load', () => {
            movingIconsContainer.appendChild(icon);
            icon.style.opacity = '0.7'; // Fade-in to 70% opacity
        });

        icon.addEventListener('error', () => {
            console.error(`Failed to load image: ${iconUrl}`);
            icon.remove();
        });

        const duration = Math.random() * 5 + 1; // 5 to 10 seconds
        icon.style.animation = `move ${duration}s ease-in-out infinite`;

        // Ensure the icon reappears when it leaves the screen
        icon.addEventListener('animationiteration', () => {
            icon.style.opacity = '0'; // Fade-out before repositioning
            setTimeout(() => {
                const newPosition = getRandomPosition(window.innerWidth - 50, window.innerHeight - 50);
                icon.style.left = `${newPosition.x}px`;
                icon.style.top = `${newPosition.y}px`;
                icon.style.opacity = '0.7'; // Fade-in after repositioning
            }, 1000); // Match fade-out transition time
        });

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
    let intervalId;
    let phase = 'regular';

    function updatePosition() {
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
    }

    function startRegularSpin() {
        clearInterval(intervalId);
        let step = 0.5; // Small step for smooth regular spin
        let elapsed = 0;

        intervalId = setInterval(() => {
            angle = (angle + step) % 360; // Increment angle
            updatePosition();
            elapsed += 10; // increment elapsed time

            if (elapsed >= REGULAR_SPIN_DURATION) {
                startSlowdown();
            }
        }, 10); // Update every 10ms for smooth animation
    }

    function startSlowdown() {
        clearInterval(intervalId);
        let step = 0.5; // Starting step for slowdown
        let elapsed = 0;
        let deceleration = 0.0006; // Smooth deceleration

        intervalId = setInterval(() => {
            angle = (angle + step) % 360; // Increment angle
            updatePosition();
            elapsed += 10; // increment elapsed time

            if (elapsed < SLOWDOWN_DURATION / 2) {
                step -= deceleration; // Decrease step to slow down
            } else {
                step += deceleration; // Increase step to speed up
            }

            if (elapsed >= SLOWDOWN_DURATION) {
                startSpeedup();
            }
        }, 10); // Update every 10ms for smooth animation
    }

    function startSpeedup() {
        clearInterval(intervalId);
        let step = 0.1; // Starting step for speedup
        let elapsed = 0;
        let acceleration = 0.0006; // Smooth acceleration

        intervalId = setInterval(() => {
            angle = (angle + step) % 360; // Increment angle
            updatePosition();
            elapsed += 10; // increment elapsed time

            if (elapsed < SPEEDUP_DURATION / 2) {
                step += acceleration; // Increase step to speed up
            } else {
                step -= acceleration; // Decrease step to stabilize
            }

            if (elapsed >= SPEEDUP_DURATION) {
                startRegularSpin();
            }
        }, 10); // Update every 10ms for smooth animation
    }

    startRegularSpin(); // Start the cycle with regular spin
}

// Add CSS for horizontal movement
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
    @keyframes move {
        0%, 100% {
            transform: translate(0, 0);
        }
        25% {
            transform: translate(10px, 10px);
        }
        50% {
            transform: translate(20px, -10px);
        }
        75% {
            transform: translate(-10px, -10px);
        }
    }
`, styleSheet.cssRules.length);
