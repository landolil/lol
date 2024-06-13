// js/allphases.js

function loadAllPhasesPage(targetId) {
    const allPhasesHTML = `
        <h2>All Phases Information</h2>
        <p>This page contains detailed information about all the phases involved in the Tardigradia project.</p>
        <ul>
            <li>Phase 1: Initial Research</li>
            <li>Phase 2: Data Collection</li>
            <li>Phase 3: Analysis</li>
            <li>Phase 4: Implementation</li>
            <li>Phase 5: Review and Feedback</li>
        </ul>
        <p>Each phase is crucial to the success of the project and involves specific tasks and objectives.</p>
    `;
    const targetElement = document.getElementById(targetId);
    targetElement.innerHTML = ''; // Clear the existing content
    targetElement.innerHTML = allPhasesHTML;
}
