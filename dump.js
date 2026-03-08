(async function() {
    console.log("%c[+] Starting Deep JS Endpoint Extraction...", "color: #00ff00; font-weight: bold;");

    // 1. Regex to catch relative/absolute paths and URLs inside strings
    const endpointRegex = /(?:(?<=["'])\/(?:[a-zA-Z0-9_\-\.]+\/)+[a-zA-Z0-9_\-\.]+(?=["'])|(?<=["'])(?:https?:\/\/[a-zA-Z0-9%._\/-]+)(?=["']))/g;

    // 2. Identify all internal and absolute scripts
    const scripts = [...document.querySelectorAll('script[src]')]
        .map(s => s.src)
        .filter(src => src.startsWith(window.location.origin) || src.startsWith('/'));

    let allEndpoints = new Set();

    // 3. Process each JS file
    async function fetchAndExtract(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const matches = text.match(endpointRegex);
            if (matches) {
                matches.forEach(m => allEndpoints.add(m));
                console.log(`%c[SCANNING] %c${url} %c(${matches.length} matches)`, "color: #5bc0de", "color: #fff", "color: #aaa");
            }
        } catch (err) {
            console.error(`[BLOCKED/ERROR] Could not read: ${url} (Likely CORS)`);
        }
    }

    // Run parallel fetches
    await Promise.all(scripts.map(url => fetchAndExtract(url)));

    // 4. Add visible HTML links as well
    document.querySelectorAll('a[href]').forEach(a => {
        let clean = a.href.split('?')[0].split('#')[0];
        if (clean.startsWith(window.location.origin)) allEndpoints.add(clean);
    });

    // 5. Finalize and Export
    const result = [...allEndpoints].sort();
    console.log(`%c[!] Discovery Complete: ${result.length} unique endpoints found.`, "color: #ff9900; font-weight: bold;");
    
    // Create download link
    const blob = new Blob([result.join('\n')], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    
    console.log("%c[+] DOWNLOAD RESULTS HERE:", "background: #222; color: #bada55; font-size: 14px; padding: 5px;");
    console.log(downloadUrl);

    // Quick view of top 20
    console.table(result.slice(0, 20));
})();
