async function validateUrl() {
    const url = process.argv[2];
    if (!url) {
        console.log('Please provide a URL');
        process.exit(1);
    }

    console.log(`Testing URL: ${url}`);
    try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Content-Length: ${res.headers.get('content-length')}`);

        if (res.ok) {
            console.log('✅ URL is valid');
        } else {
            console.log('❌ URL returned error status');
        }
    } catch (e) {
        console.error('❌ Error fetching URL:', e);
    }
}

validateUrl();
