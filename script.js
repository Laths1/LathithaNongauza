const buttons = document.querySelectorAll("[data-carousel-button]")

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const offset = button.dataset.carouselButton === "next" ? 1 : -1
    const slides = button
      .closest("[data-carousel]")
      .querySelector("[data-slides]")

    const activeSlide = slides.querySelector("[data-active]")
    let newIndex = [...slides.children].indexOf(activeSlide) + offset
    if (newIndex < 0) newIndex = slides.children.length - 1
    if (newIndex >= slides.children.length) newIndex = 0

    slides.children[newIndex].dataset.active = true
    delete activeSlide.dataset.active
  })
})

let pdfDocs = {};
let currentPages = {};
let currentScales = {};

async function loadPDF(containerId, pdfUrl) {
    const container = document.getElementById(containerId);
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    
    try {
        const pdf = await loadingTask.promise;
        pdfDocs[containerId] = pdf;
        currentPages[containerId] = 1;
        currentScales[containerId] = 1.0;
        
        // Display total pages
        document.getElementById(`total-pages-${containerId.split('-')[2]}`).textContent = pdf.numPages;
        
        await renderPage(containerId);
    } catch (error) {
        console.error('Error loading PDF:', error);
        container.innerHTML = `<p class="error">Failed to load PDF. <a href="${pdfUrl}">Download instead</a></p>`;
    }
}

async function renderPage(containerId) {
    const pdf = pdfDocs[containerId];
    const pageNum = currentPages[containerId];
    const scale = currentScales[containerId];
    
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    container.appendChild(canvas);
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Update page info
    document.getElementById(`current-page-${containerId.split('-')[2]}`).textContent = pageNum;
}

function nextPage(containerId) {
    const pdf = pdfDocs[containerId];
    if (currentPages[containerId] < pdf.numPages) {
        currentPages[containerId]++;
        renderPage(containerId);
    }
}

function prevPage(containerId) {
    if (currentPages[containerId] > 1) {
        currentPages[containerId]--;
        renderPage(containerId);
    }
}

function zoomPDF(containerId, delta) {
    if (!currentScales[containerId]) {
        currentScales[containerId] = 1.0;
    }
    
    // Update scale
    currentScales[containerId] = Math.max(0.3, currentScales[containerId] + delta);
    
    // **CHANGE THIS: Always re-render with PDF.js for sharp zoom**
    renderPage(containerId);
    
    // Update zoom display
    updateZoomDisplay(containerId, currentScales[containerId]);
}

// Make sure renderPage uses the current scale
async function renderPage(containerId) {
    const pdf = pdfDocs[containerId];
    if (!pdf) return;
    
    const pageNum = currentPages[containerId] || 1;
    const scale = currentScales[containerId] || 1.0; // Use the zoom scale here
    
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale }); // This is where zoom happens
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set higher resolution for mobile/retina displays
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.height = viewport.height * pixelRatio;
    canvas.width = viewport.width * pixelRatio;
    
    // Scale the context
    context.scale(pixelRatio, pixelRatio);
    
    // Set display size
    canvas.style.height = `${viewport.height}px`;
    canvas.style.width = `${viewport.width}px`;
    
    container.appendChild(canvas);
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Update page info
    document.getElementById(`current-page-${containerId.split('-')[2]}`).textContent = pageNum;
}

// Add this function if you don't have it
function updateZoomDisplay(containerId, scale) {
    const pageNum = containerId.split('-')[2];
    const zoomDisplay = document.getElementById(`zoom-level-${pageNum}`);
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(scale * 100)}%`;
    }
}

function toggleFullscreen(containerId) {
    const container = document.getElementById(containerId);
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Initialize PDFs on page load
window.addEventListener('DOMContentLoaded', () => {
    loadPDF('pdf-canvas-1', './Brain_cancer_detection.pdf');
    loadPDF('pdf-canvas-2', './ReconChess.pdf');
    loadPDF('pdf-canvas-3', './Negative_sampling_skipGram.pdf');
    loadPDF('pdf-canvas-4', './Improved_DQN_vs_PPO.pdf');
    loadPDF('pdf-canvas-5', './WCST_with_transformers.pdf');
    loadPDF('pdf-canvas-6', './Effects_of_pre&nonepretrained_tokens.pdf');
    loadPDF('pdf-canvas-7', './Dimensionality reduction analysis of NBA player statistics.pdf');
    // Add more PDFs as needed
});
