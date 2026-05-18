<!-- StayNest Logo Usage Guide -->

<!-- FULL LOGO (for hero, landing page) - Use with width: 300-400px -->
<img src="/images/staynest-logo.svg" alt="StayNest" class="logo-full" width="350" />

<!-- SMALL LOGO (for navbar, buttons, favicon) - Use with width: 32-64px -->
<img src="/images/staynest-logo-small.svg" alt="StayNest" class="logo-small" width="48" />

<!-- CSS Classes for Sizing -->
<style>
  /* Full logo - for hero sections, landing pages */
  .logo-full {
    width: 350px;
    height: auto;
    max-width: 100%;
  }

  /* Small logo - for navbar, buttons, favicons */
  .logo-small {
    width: 48px;
    height: auto;
  }

  /* Tiny logo - for favicons, small icons */
  .logo-tiny {
    width: 32px;
    height: auto;
  }

  /* Logo with hover effect */
  .logo-hover {
    transition: transform 0.3s ease, filter 0.3s ease;
  }

  .logo-hover:hover {
    transform: scale(1.05);
    filter: drop-shadow(0 4px 8px rgba(255, 159, 61, 0.3));
  }

  /* Centered logo */
  .logo-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<!-- USAGE EXAMPLES -->

<!-- In Navbar -->
<nav class="navbar">
  <a href="/" class="navbar-brand">
    <img src="/images/staynest-logo-small.svg" alt="StayNest" width="40" />
    <span>StayNest</span>
  </a>
</nav>

<!-- As Favicon (in <head>) -->
<link rel="icon" type="image/svg+xml" href="/images/staynest-logo-small.svg" />
<link rel="shortcut icon" href="/images/staynest-logo-small.svg" />

<!-- Full Hero Logo -->
<header class="hero">
  <div class="hero-logo logo-center">
    <img src="/images/staynest-logo.svg" alt="StayNest Logo" width="300" class="logo-hover" />
  </div>
</header>

<!-- In Buttons -->
<button class="btn btn-primary">
  <img src="/images/staynest-logo-small.svg" alt="" width="20" />
  StayNest
</button>

<!-- Colors Used -->
<!-- Light Orange: #FFB366 (primary) -->
<!-- Dark Orange: #FF9F3D (secondary) -->
<!-- Accent Orange: #E67E22 (border/stroke) -->
<!-- Light Accent: #FFCC99 (highlights) -->
