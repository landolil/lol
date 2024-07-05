// js/buttons.js
document.addEventListener('DOMContentLoaded', () => {
    const slideshowButton = document.getElementById('slideshow-button');
    const releaseTardigradesButton = document.getElementById('release-tardigrades-button');
    const crowdSourceButton = document.getElementById('crowdsource-button');
    const pdfButton = document.getElementById('pdf-button');
    const stopSlideshowButton = document.getElementById('stop-slideshow-button');
    const reloadButton = document.getElementById('reload-button');

    if (slideshowButton) slideshowButton.addEventListener('click', startSlideshow);
    if (releaseTardigradesButton) releaseTardigradesButton.addEventListener('click', releaseTardigrades);
    if (crowdSourceButton) crowdSourceButton.addEventListener('click', openCrowdSource);
    if (pdfButton) pdfButton.addEventListener('click', downloadPDF);
    if (stopSlideshowButton) stopSlideshowButton.addEventListener('click', stopSlideshow);
    if (reloadButton) reloadButton.addEventListener('click', () => location.reload());

    function startSlideshow() {
        console.log('Start Slideshow');
        // Implement the slideshow start functionality
    }

    function releaseTardigrades() {
        console.log('Release Tardigrades');
		                const allImageUrls = createRandomIcons();
                createMovingIcons(allImageUrls);
        // Implement the release tardigrades functionality
    }

    function openCrowdSource() {
        console.log('Open CrowdSource');
		   loadCrowdsourcePage('main-frame');
        // Implement the crowdsource functionality
    }

    function downloadPDF() {
        console.log('Download PDF');
        window.location.href = 'files/Tardigradia_land_o_lil_Multiphase_Vision_2024.pdf';
    }

    function stopSlideshow() {
        console.log('Stop Slideshow');
        // Implement the slideshow stop functionality
    }
});
