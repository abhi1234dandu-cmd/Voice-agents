# Troubleshooting

If the web app fails to start, run `npm install` from the repository root and confirm Node.js is at least version 20.11.

If Python imports fail, create a virtual environment and run `pip install -r apps/api/requirements.txt`.

If Docker database initialization does not rerun after schema edits, remove the `postgres-data` volume before restarting. Do not do this against a database with data you need.

If voice preview audio does not play, interact with the page first. Browsers block unmuted autoplay, so Votell only speaks after an explicit click.

If Twilio webhooks fail validation, confirm the public URL, exact request params, and `TWILIO_AUTH_TOKEN` match the Twilio console.
