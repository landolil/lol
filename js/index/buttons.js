// js/buttons.js
document.addEventListener('DOMContentLoaded', () => {
    const slideshowButton = document.getElementById('slideshow-button');

	
    const releaseTardigradesButton = document.getElementById('release-tardigrades-button');
    const crowdSourceButton = document.getElementById('crowdsource-button');
    const pdfButton = document.getElementById('pdf-button');
    const stopSlideshowButton = document.getElementById('stop-slideshow-button');
    const logoshowButton = document.getElementById('logoshow-button');
//    const stencilshowButton = document.getElementById('stencilshow-button');
 //   const stopLogoshowButton = document.getElementById('stop-logoshow-button');

    const reloadButton = document.getElementById('reload-button');

    if (slideshowButton) slideshowButton.addEventListener('click', startRandomSlideshow);

    if (releaseTardigradesButton) releaseTardigradesButton.addEventListener('click', releaseTardigrades);
    if (crowdSourceButton) crowdSourceButton.addEventListener('click', openCrowdSource);
    if (pdfButton) pdfButton.addEventListener('click', downloadPDF);
    if (stopSlideshowButton) stopSlideshowButton.addEventListener('click', stopRandomSlideshow);

    if (reloadButton) reloadButton.addEventListener('click', () => location.reload());

    if (logoshowButton) logoshowButton.addEventListener('click', startLogoshow);

   // if (stencilshowButton) stencilshowButton.addEventListener('click', startStencilshow);
	
   // if (stopLogoshowButton) stopLogoshowButton.addEventListener('click', stopRandomLogoshow);
	

	
	    function startSlideshow() {
        console.log('(S) Start Slideshow');
		startRandomSlideshow();
        // Implement the slideshow start functionality
    }

	


    function releaseTardigrades() {
        console.log('(T) Release Tardigrades');
		        const allImageUrls = createRandomIcons();
                createMovingIcons(allImageUrls);
        // Implement the release tardigrades functionality
    }

    function openCrowdSource() {
        console.log('($) Open CrowdSource');
		   loadCrowdsourcePage('main-frame');
        // Implement the crowdsource functionality
    }

    function downloadPDF() {
        console.log('(P) Download PDF');
        window.location.href = 'files/Tardigradia_land_o_lil_Multiphase_Vision_2024.pdf';
    }

    function stopSlideshow() {
        console.log('(X) Stop Slideshow');
		stopRandomSlideshow();
        // Implement the slideshow stop functionality
    }

	
   function startLogoshow() {
       console.log('(S) Start Logoshow');
	   startRandomLogoshow();
    //     Implement the logoshow start functionality
    }

//  function startStencilshow() {
 //      console.log('(S) Start Stencilshow');
//	   startRandomStencilshow();
    //     Implement the stencilshow start functionality
 //   }


//	    function stopLogoshow() {
 //       console.log('(S) Stop Logoshow');
//		stopRandomLogoshow();
   //      Implement the logoshow stop functionality
 //  }

		        const allImageUrls = createRandomIcons();
                createMovingIcons(allImageUrls);
    startRandomLogoshow();
});
