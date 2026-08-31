import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url for path manipulation in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import seoConfig per ottenere il siteUrl
// Usiamo il file generato precedentemente
const siteUrl = "https://www.serradesk.it"; 

const PUBLIC_ROUTES = [
  '/',
  '/preventivi',
  '/guida',
  '/termini',
  '/privacy',
  '/login',
  '/update-password'
];

async function generateSitemap() {
  console.log('Generating sitemap...');

  const sitemapUrls = [...PUBLIC_ROUTES];

  // Cartella degli articoli/guide
  const contentDir = path.join(__dirname, '../src/content/guides');
  
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir);
    files.forEach(file => {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const slug = file.replace(/\.mdx?$/, '');
        sitemapUrls.push(`/guida/${slug}`);
      }
    });
  } else {
    // Crea la cartella se non esiste
    fs.mkdirSync(contentDir, { recursive: true });
    console.log(`Creato folder per articoli: ${contentDir}`);
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === '/' || url === '/preventivi' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;

  // Salva la sitemap in `public/sitemap.xml`
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log(`Sitemap generata con successo in: ${sitemapPath}`);
  console.log(`Totale URL indicizzati: ${sitemapUrls.length}`);
}

generateSitemap().catch(console.error);
