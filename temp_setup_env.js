const fs = require('fs');

// Note: We use double backslashes \\n to represent literal \n in the file, 
// because standard .env parsers usually treat \n as a newline character 
// only if double-quoted, or sometimes they need literal newlines.
// The code in src/lib/firebase/admin.ts uses .replace(/\\n/g, '\n'),
// which suggests it expects literal "\n" characters in the string.

const content = `NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA9SI58TpTlDuzW6q8-sfiesfr_RiD8D3M"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="studio-9836771777-aa965.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="studio-9836771777-aa965"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="studio-9836771777-aa965.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="288107915505"
NEXT_PUBLIC_FIREBASE_APP_ID="1:288107915505:web:745405a36f01beb2182150"

# SERVICE ACCOUNT (ADMIN) KEYS
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-j2621@studio-9836771777-aa965.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCYU4FWOOZJH69T\\nDdvHNsvRZpbPNAmsD/5S9wNK7IRjjdVPwgmsqqP9aNCt04FTSU9KC5hCICYJ9Wd5\\ngOx53ivJj7+jPuKZWdNWTOj7Nz6OzDhta1mHzAWKWQeBgMvTTff1THTAO9DTnmhQ\\no496MTVSzG+Nmo4zdSnOE7UybWhuCRshjKawRWnGEkS1RmGtJtptlGHFHEAHB4SG\\nKGhze9RK1flbSodKDDia+F2IotMSzBvmt96+Hft0FsB5jLDPefH74utpYmy/jo5W\\nL1chnT/rYa3UTkAIm7i9s5to+7uPj1rSvVKQqOKMfCaTaIIrqG/LUeLH/GZDPlci\\nPztmpEc/AgMBAAECggEARGTqI760l4ykehQ05EPUTBdWC38AAMPFm5bRYajE4LZk\\nWsVy9pY/v556ZDIdVToLYeHG4ZnxunL3nPSoOSfqXTwv/apUsCpG2+74hSOO8Sr9\\nAxQ6ROD0c+P5nMopupy9guRrX4z7/KiZieuGloTVvnGQfPIyeyRWOvNaXmQFibHX\\ng0JglZQ1yQEdTAw6NA7zkWsiWO8BnG8qZQRlHX4eA6AOt9TOdFMfgI9A/cqCI1EA\\n214zK8auCLv84/HeAzZA+YcrGuXETsa1TPQLYMuO+RHcv+XhGbV7h3hrAVitaJzF\\nn1y/SeBiQzpVI73J2E8sZUVzS13Ol8FjoOOh7ErQIQKBgQDNwd9zPD75pogjJ93L\\nQxK0GuANH4CaAUaeiMWDRzO6Sp/IrgzOWaZcU6NtnhgkAKJkXpOUK9+0YH/2svNs\\n040vxxP7ijQMgOH91ioVwyhalvo64bo3PKyZxqXf9YceXAn42CVKRh2A6xuvOZjM\\nQo+pP8l72RpD2mlBWF2bIdIl1wKBgQC9hZdZNe/BJHklffHH8s/cDvY1HkealBNH\\nN5BKIFW2Ww3jxYSE0UYSrCfgTLbqCiYzYPdTeuTzKdfHZIK7xVKYwyui7ieUYvpo\\n1P0FwC6RmPN/8nfob94puiNfh/R6HMusy8BBKjx9j2FnEG3kzTJG96wrsqdgWxY8\\nB8uksGDs2QKBgQCuK5KuxSy5v1I2ECUbTmeita067pO5yaKxyC0Jd1g+NbUT9uE4\\nO4MrXFFXFSByOWc9dyGNp6Xx1k370ndkg59b9jTgFJkCjIbAjG2Lhmu+Y1bmSPWM\\nlHu2oAUBk6EQ/fAjCTRnrvqCioIgzayeGynopuozQA+PqG64tchm7TYqeQKBgQCf\\n9K2dpNE7EV6STy8OlBftYk9Y27qRc6Klu/azKYFODKG3eRB0zPA4eEaboAPNmk1N\\nleyI77NmrA0rg+B3PH6O4kLlG94Z9kPk0MbQ4LgtOItjlLCxZCF81FZgna2wlrcs\\nmzcjiNNPIgGSbCJkNu/VR9pvczSjNZ2ZgvbUg+z6WQKBgQCFTsh2lyK71sYU/IQi\\nXTJxV9V1DpC9bNqqCFq1xPVUbRXnPSCw+uP70atqlrYsOHrFnWCSvrhV0doFZfpq\\nDz8g+jDnNPpemoNXaUeFShWkiwWnAdmZwoPM6u33D4V1ppKQDCktmGK3rEpxU/Bq\\n8QaNExwSL6SerQpIhYo9vgw/hw==\\n-----END PRIVATE KEY-----"

# AI & EMAIL
GEMINI_API_KEY="AIzaSyDtbHRgDLFSrd82g955lU5p9fdiFIhh8Bo"
RESEND_API_KEY=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

try {
    fs.writeFileSync('.env.local', content, { encoding: 'utf8' });
    console.log('SUCCESS: .env.local rewritten successfully.');
} catch (err) {
    console.error('ERROR writing .env.local:', err);
    process.exit(1);
}
