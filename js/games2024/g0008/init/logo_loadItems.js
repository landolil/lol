
// js/logo_loaditems.js

let logo_currentLevel = 'ENGLISH';
let logo_currentData = logo_data;
const logo_sidebar = document.getElementById('logo_sidebar');
const logo_mainImage = document.getElementById('main-image');
const logo_details = document.getElementById('logo_details');
const logo_navBar = document.getElementById('nav-bar');

function logo_loaditems(logo_items, logo_type, logo_parentName = null) {
    logo_sidebar.innerHTML = '';
    logo_items.forEach((logo_item) => {
        const logo_itemDiv = document.createElement('div');
        logo_itemDiv.classList.add('logo-item');
        if (logo_type === 'pictures') {
            logo_mainImage.src = 'images/whitepixle.jpg';
            logo_itemDiv.innerHTML = `<img src="${logo_item.url}" alt="${logo_item.title}" class="thumbnail"><div>${logo_item.title}</div>`;
        } else {
            logo_itemDiv.innerHTML = logo_item.name;
        }
        logo_itemDiv.addEventListener('click', () => {
            if (logo_type === 'ENGLISH') {
                logo_currentLevel = 'COLOR_STYLE';
                logo_currentData = logo_item;
                logo_loaditems(logo_item.COLOR_STYLE, 'COLOR_STYLE', logo_item.name);
            } else if (logo_type === 'COLOR_STYLE') {
                logo_currentLevel = 'DESIGN_STYLE';
                logo_currentData = logo_item;
                logo_loaditems(logo_item.DESIGN_STYLE, 'DESIGN_STYLE', logo_item.name);
            } else if (logo_type === 'DESIGN_STYLE') {
                logo_currentLevel = 'images';
                logo_currentData = logo_item;
                logo_details.innerHTML = `
                    <h2>${logo_item.name}</h2>
                    <p>${logo_item.description}</p>
                    <p><strong>Parent:</strong> ${logo_parentName}</p>`;
                logo_loaditems(logo_item.images, 'images');
            } else if (logo_type === 'images') {
                logo_mainImage.src = logo_item.url;
                logo_mainImage.alt = logo_item.title;
            }
        });
        logo_sidebar.appendChild(logo_itemDiv);
    });
    logo_navBar.style.display = logo_currentLevel === 'ENGLISH' ? 'none' : 'block';
}

logo_navBar.addEventListener('click', () => {
    if (logo_currentLevel === 'COLOR_STYLE') {
        logo_currentLevel = 'ENGLISH';
        logo_currentData = logo_data;
        logo_loaditems(logo_data.ENGLISH, 'ENGLISH');
        logo_details.innerHTML = '';
    } else if (logo_currentLevel === 'DESIGN_STYLE') {
        logo_currentLevel = 'COLOR_STYLE';
        logo_loaditems(logo_currentData.COLOR_STYLE, 'COLOR_STYLE', logo_currentData.name);
    } else if (logo_currentLevel === 'images') {
        logo_currentLevel = 'DESIGN_STYLE';
        logo_loaditems(logo_currentData.DESIGN_STYLE, 'DESIGN_STYLE', logo_currentData.name);
    }
});
