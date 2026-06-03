/* ============================================================
   SPLINE 3D SCENE LOADER
   Loads the Spline scene with a loading state
   ============================================================ */

const SCENE_URL = 'https://prod.spline.design/0S5h-umeR2tIvbar/scene.splinecode';

let splineApp = null;

async function initSpline() {
  const canvas = document.getElementById('canvas3d');
  const preloader = document.getElementById('preloader');
  const preloaderTitle = document.getElementById('preloader-title');
  const progressText = document.getElementById('preloader-progress');
  const progressBar = document.getElementById('preloader-bar-fill');

  if (!canvas) {
    console.error('[Spline] Canvas element #canvas3d not found');
    return;
  }

  // Fake progress simulation since splineApp.load doesn't give a progress event
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 1;
    if (progress > 95) progress = 95; // Hold at 95% until actually loaded
    if (progressText) progressText.textContent = progress;
    if (progressBar) progressBar.style.width = progress + '%';
    if (preloaderTitle) preloaderTitle.style.setProperty('--fill', progress + '%');
  }, 100);

  try {
    // Dynamic import from CDN
    const { Application } = await import('https://esm.sh/@splinetool/runtime');

    splineApp = new Application(canvas);

    await splineApp.load(SCENE_URL);

    // Scene loaded
    clearInterval(progressInterval);
    progress = 100;
    if (progressText) progressText.textContent = progress;
    if (progressBar) progressBar.style.width = '100%';
    if (preloaderTitle) preloaderTitle.style.setProperty('--fill', '100%');

    // Sequence the exit animations
    setTimeout(() => {
      // 1. Reveal subtitle
      if (preloader) preloader.classList.add('reveal');
      
      setTimeout(() => {
        // 2. Slide out the preloader
        if (preloader) preloader.classList.add('exit');
        canvas.classList.add('loaded');

        setTimeout(() => {
          // 3. Trigger hero animations and remove preloader
          document.body.classList.add('loaded');
          if (preloader) preloader.classList.add('done');
        }, 1000); // Wait for exit slide
      }, 800); // Wait for fill to settle
    }, 200);

    console.log('[Spline] Scene loaded successfully');
  } catch (err) {
    console.error('[Spline] Failed to load scene:', err);
    clearInterval(progressInterval);
    // Still hide preloader on error so the page is usable
    if (preloader) {
       preloader.classList.add('exit');
       setTimeout(() => {
         document.body.classList.add('loaded');
         preloader.classList.add('done');
       }, 1000);
    }
    canvas.style.opacity = '1';
    canvas.style.background = 'var(--color-bg)';
  }
}

// Handle canvas resize
function handleResize() {
  const canvas = document.getElementById('canvas3d');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

window.addEventListener('resize', handleResize);

export { initSpline, splineApp };
