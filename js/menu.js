document.addEventListener('DOMContentLoaded', () => {
    const menu = document.createElement('div');
    menu.id = 'menu';
    menu.style.width = '30px'; // Set a more visible initial width
    menu.style.height = '100%';
    menu.style.position = 'fixed';
    menu.style.top = '0';
    menu.style.right = '0'; // Move menu to the right
    menu.style.backgroundColor = 'lightgray';
    menu.style.overflow = 'hidden';
    menu.style.transition = 'width 0.5s';

    const buttons = {
        S: 'Slideshow',
        R: 'Release Tardigrades',
        C: 'CrowdSource',
        P: 'PDF',
        X: 'Stop Slideshow',
        '~': 'Reload'
    };

    for (let key in buttons) {
        const button = document.createElement('button');
        button.textContent = key;
        button.dataset.fullText = buttons[key];
        button.title = buttons[key];
        button.id = `${buttons[key].toLowerCase().replace(' ', '-')}-button`;
        button.className = 'menu-button';
        menu.appendChild(button);
    }

    const expandButton = document.createElement('button');
    expandButton.textContent = '<-';
    expandButton.className = 'menu-button';
    expandButton.onclick = () => {
        if (menu.style.width === '30px') {
            menu.style.width = '200px';
            document.querySelectorAll('.menu-button').forEach(button => {
                if (button.dataset.fullText) {
                    button.textContent = button.dataset.fullText;
                }
            });
            expandButton.textContent = '-->';
        } else {
            menu.style.width = '30px';
            document.querySelectorAll('.menu-button').forEach(button => {
                if (button.dataset.fullText) {
                    button.textContent = button.dataset.fullText.charAt(0);
                }
            });
            expandButton.textContent = '<-';
        }
    };
    menu.appendChild(expandButton);

// Create the single purple button with vertical text "Tardigradia"
const purpleButton = document.createElement('button');
purpleButton.textContent = "Tardigradia";
purpleButton.style.backgroundColor = 'purple';
purpleButton.style.color = 'white';
purpleButton.style.width = '30px'; // Adjust button width
purpleButton.style.height = '200px'; // Adjust button height for vertical text
purpleButton.style.marginTop = '10px'; // Adjust spacing from previous button
purpleButton.style.position = 'relative'; // Ensure relative positioning for absolute text
purpleButton.style.textAlign = 'center'; // Center align text
purpleButton.style.writingMode = 'vertical-rl'; // Vertical text orientation
purpleButton.style.textOrientation = 'upright';
purpleButton.style.fontSize = '14px'; // Adjust text size
purpleButton.style.position = 'relative';
purpleButton.style.bottom = '0';

// Adjust line height and padding to minimize space between letters
purpleButton.style.lineHeight = '1'; // Set line height to 1
purpleButton.style.padding = '2px 0'; // Adjust padding top and bottom

menu.appendChild(purpleButton);


    document.body.appendChild(menu);
});
