(() => {
  const path = location.pathname.replace(/\\/g, '/');
  const file = path.split('/').pop() || 'index.html';
  const page = document.body?.dataset?.page || (file === 'index.html' ? 'home' : file.replace(/\.html$/, ''));
  const tool = document.body?.dataset?.tool || '';
  const siteUrl = (window.SITE_URL || location.origin).replace(/\/$/, '');
  const siteName = window.SITE_NAME || 'WAHID Academic Atelier';

  const pages = {
    home: { title: 'WAHID Academic Atelier — Civil Engineering & Academic Workspace', description: "Wahid's academic archive, civil engineering work, practical engineering tools, projects and study resources." },
    work: { title: 'Academic Work & Engineering Archive — WAHID', description: 'Browse academic reports, assignments, projects, laboratory work and civil engineering study materials from Wahid.' },
    toolkit: { title: 'Civil Engineering Tools & Calculators — WAHID', description: 'Practical civil engineering calculators and academic tools for flow, materials, units, graphs, formulas and study workflows.' },
    projects: { title: 'Civil Engineering Projects — WAHID', description: 'Academic civil engineering projects, engineering studies and selected collaborative work from Wahid.' },
    people: { title: 'People & Collaborators — WAHID', description: 'Selected collaborators and project partners connected with Wahid’s academic and engineering work.' },
    about: { title: 'About Wahid — Civil Engineering Student & Academic Archive', description: 'About Wahid, his civil engineering studies, academic work and the purpose of this digital archive.' },
    updates: { title: 'Latest Academic Updates — WAHID', description: 'Recent additions, project updates and new material from Wahid’s academic archive.' },
    formulas: { title: 'Civil Engineering Formula Library — WAHID', description: 'Quick-reference civil engineering formulas for coursework, laboratory analysis and engineering study.' },
    equations: { title: 'Engineering Equation Solver — WAHID', description: 'A browser-based engineering equation solver for common academic and civil engineering calculations.' },
    graph: { title: 'Engineering Graph Generator — WAHID', description: 'Create linear, log-log and semi-log engineering graphs and export your readings for academic work.' },
    materials: { title: 'Civil Engineering Materials Tools — WAHID', description: 'Practical construction-material calculations and reference tools for civil engineering coursework.' },
    labgenerator: { title: 'Civil Engineering Lab Report Generator — WAHID', description: 'Prepare structured civil engineering laboratory reports from your experiment details and readings.' },
    notes: { title: 'Civil Engineering Study Notes — WAHID', description: 'Academic notes and study references collected for civil engineering coursework.' },
    exam: { title: 'Civil Engineering Exam Resources — WAHID', description: 'Exam-focused civil engineering study resources, questions and academic references.' },
    certificates: { title: 'Certificates & Achievements — WAHID', description: 'Selected academic certificates, achievements and milestones from Wahid’s engineering journey.' },
    tool: { title: 'Civil Engineering Calculator — WAHID', description: 'A practical browser-based civil engineering calculator from WAHID Academic Atelier.' },
    resources: { title: 'Civil Engineering Guides & Study Resources — WAHID', description: 'Practical civil engineering guides covering hydraulics, fluid mechanics, construction estimation, laboratory reports, unit conversion and geotechnical graphs.' }
  };

  const tools = {
    manning: { title: 'Manning Flow Calculator — Civil Engineering | WAHID', description: "Calculate open-channel discharge using Manning's equation with area, hydraulic radius, roughness and slope." },
    reynolds: { title: 'Reynolds Number Calculator — Civil Engineering | WAHID', description: 'Calculate Reynolds number and common internal pipe-flow classification from density, velocity, diameter and viscosity.' },
    concrete: { title: 'Concrete Material Estimator — Civil Engineering | WAHID', description: 'Estimate approximate cement, sand and aggregate quantities for preliminary concrete-material calculations.' },
    brickwork: { title: 'Brickwork Estimator — Civil Engineering | WAHID', description: 'Estimate wall volume, approximate brick quantity and basic mortar materials for preliminary brickwork calculations.' },
    converter: { title: 'Engineering Unit Converter — Civil Engineering | WAHID', description: 'Convert common length, pressure, force and volume units for civil engineering study and calculations.' }
  };

  const resources = {
    'manning-equation-guide': { title: 'Manning’s Equation: A Practical Civil Engineering Guide — WAHID', description: 'Understand Manning’s equation, hydraulic radius, roughness, slope and open-channel discharge calculations.' },
    'reynolds-number-guide': { title: 'Reynolds Number: Meaning, Formula and Flow Classification — WAHID', description: 'Learn how Reynolds number is calculated and used to classify common internal pipe flow.' },
    'concrete-estimation-guide': { title: 'Concrete Material Estimation: A Practical Starting Method — WAHID', description: 'Learn a transparent preliminary method for estimating concrete cement, sand and aggregate quantities.' },
    'brickwork-estimation-guide': { title: 'Brickwork Estimation: Wall Volume, Bricks and Mortar — WAHID', description: 'Learn a practical preliminary workflow for estimating brickwork quantities and mortar assumptions.' },
    'engineering-unit-conversion-guide': { title: 'Engineering Unit Conversion: A Reliable Workflow — WAHID', description: 'Practical unit-conversion guidance for common civil engineering calculations.' },
    'civil-engineering-lab-report-guide': { title: 'Civil Engineering Lab Report: A Clear Structure — WAHID', description: 'A practical structure for organizing civil engineering laboratory observations, calculations and conclusions.' },
    'particle-size-distribution-guide': { title: 'Particle Size Distribution Curve: How to Read and Plot It — WAHID', description: 'Understand percent finer and logarithmic particle-size plotting for geotechnical laboratory work.' }
  };
  const resource = page === 'resource' ? resources[document.body?.dataset?.resource] : null;
  const data = page === 'tool' ? (tools[tool] || pages.tool) : (resource || pages[page] || pages.home);
  const canonical = resource ? `${siteUrl}/resources/${document.body.dataset.resource}.html` : `${siteUrl}/${file === 'index.html' ? '' : file}`;

  const setMeta = (name, content) => {
    let el = document.head.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
    el.content = content;
  };
  const setProp = (property, content) => {
    let el = document.head.querySelector(`meta[property="${property}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.content = content;
  };

  document.title = data.title;
  setMeta('description', data.description);
  setMeta('robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  setMeta('googlebot', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  setProp('og:title', data.title);
  setProp('og:description', data.description);
  setProp('og:type', page === 'work' || page === 'projects' ? 'article' : 'website');
  setProp('og:url', canonical);
  setProp('og:site_name', siteName);
  setProp('og:locale', 'en_US');
  setProp('twitter:card', 'summary');
  setProp('twitter:title', data.title);
  setProp('twitter:description', data.description);

  let canonicalEl = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalEl) { canonicalEl = document.createElement('link'); canonicalEl.rel = 'canonical'; document.head.appendChild(canonicalEl); }
  canonicalEl.href = canonical;

  const schemas = [];
  if (page === 'tool') {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'WebApplication', name: data.title,
      url: canonical, description: data.description, applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web', isAccessibleForFree: true,
      author: { '@type': 'Person', name: 'Wahid' }, provider: { '@type': 'Person', name: 'Wahid' }
    });
  } else if (page === 'resource') {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'Article', name: data.title,
      headline: data.title, url: canonical, description: data.description,
      author: { '@type': 'Person', name: 'Wahid' }, publisher: { '@type': 'Person', name: 'Wahid' }
    });
  } else {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'WebSite', name: siteName,
      url: `${siteUrl}/`, description: pages.home.description,
      author: { '@type': 'Person', name: 'Wahid' }
    });
  }
  schemas.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: page === 'tool' ? 'Toolkit' : (data.title.split(' — ')[0]), item: canonical }
    ]
  });

  let ld = document.head.querySelector('#siteStructuredData');
  if (!ld) { ld = document.createElement('script'); ld.id = 'siteStructuredData'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

  const verification = (window.GOOGLE_SITE_VERIFICATION || '').trim();
  if (verification) setMeta('google-site-verification', verification);
})();
