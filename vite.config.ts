import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/create-preference', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                // Define the host so we return localhost in dev environment
                const host = req.headers.host || 'localhost:8080';
                const protocol = host.includes('localhost') ? 'http' : 'https';
                const baseUrl = `${protocol}://${host}`;

                const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer APP_USR-8354303606767691-031609-f4a553f2ce9da5a30a793f13ed9e63f3-3269966505`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        items: [{ 
                           title: parsed.description || "Inscrição - Workshop de Dança IBF", 
                           quantity: 1, 
                           unit_price: Number(parsed.totalValue) 
                        }],
                        back_urls: { 
                           success: `${baseUrl}/`, 
                           failure: `${baseUrl}/`, 
                           pending: `${baseUrl}/` 
                        },
                        auto_return: "approved"
                    })
                });
                const data = await response.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ init_point: data.init_point }));
              } catch(err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
