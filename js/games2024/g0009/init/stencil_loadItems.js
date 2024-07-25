// js/stencil_loaditems.js

let stencil_currentLevel = 'STENCIL';
let stencil_currentData = stencil_data;
const stencil_sidebar = document.getElementById('stencil_sidebar');
const stencil_mainImage = document.getElementById('main-image');
const stencil_details = document.getElementById('stencil_details');
const stencil_navBar = document.getElementById('nav-bar');

function stencil_loaditems(stencil_items, stencil_type, stencil_parentName = null) {
    stencil_sidebar.innerHTML = '';
    stencil_items.forEach((stencil_item) => {
        const stencil_itemDiv = document.createElement('div');
        stencil_itemDiv.classList.add('stencil-item');
        if (stencil_type === 'pictures') {
            stencil_mainImage.src = 'images/whitepixle.jpg';
            stencil_itemDiv.innerHTML = `<img src="${stencil_item.url}" alt="${stencil_item.title}" class="thumbnail"><div>${stencil_item.title}</div>`;
        } else {
            stencil_itemDiv.innerHTML = stencil_item.name;
        }
        stencil_itemDiv.addEventListener('click', () => {
            if (stencil_type === 'STENCIL') {
                stencil_currentLevel = 'COLOR_STYLE';
                stencil_currentData = stencil_item;
                stencil_loaditems(stencil_item.COLOR_STYLE, 'COLOR_STYLE', stencil_item.name);
            } else if (stencil_type === 'COLOR_STYLE') {
                stencil_currentLevel = 'DESIGN_STYLE';
                stencil_currentData = stencil_item;
                stencil_loaditems(stencil_item.DESIGN_STYLE, 'DESIGN_STYLE', stencil_item.name);
            } else if (stencil_type === 'DESIGN_STYLE') {
                stencil_currentLevel = 'images';
                stencil_currentData = stencil_item;
                stencil_details.innerHTML = `
                    <h2>${stencil_item.name}</h2>
                    <p>${stencil_item.description}</p>
                    <p><strong>Parent:</strong> ${stencil_parentName}</p>`;
                stencil_loaditems(stencil_item.images, 'images');
            } else if (stencil_type === 'images') {
                stencil_mainImage.src = stencil_item.url;
                stencil_mainImage.alt = stencil_item.title;
            }
        });
        stencil_sidebar.appendChild(stencil_itemDiv);
    });
    stencil_navBar.style.display = stencil_currentLevel === 'STENCIL' ? 'none' : 'block';
}

stencil_navBar.addEventListener('click', () => {
    if (stencil_currentLevel === 'COLOR_STYLE') {
        stencil_currentLevel = 'STENCIL';
        stencil_currentData = stencil_data;
        stencil_loaditems(stencil_data.STENCIL, 'STENCIL');
        stencil_details.innerHTML = '';
    } else if (stencil_currentLevel === 'DESIGN_STYLE') {
        stencil_currentLevel = 'COLOR_STYLE';
        stencil_loaditems(stencil_currentData.COLOR_STYLE, 'COLOR_STYLE', stencil_currentData.name);
    } else if (stencil_currentLevel === 'images') {
        stencil_currentLevel = 'DESIGN_STYLE';
        stencil_loaditems(stencil_currentData.DESIGN_STYLE, 'DESIGN_STYLE', stencil_currentData.name);
    }
});
