# Telephony Setup

The local provider is `mock`. It simulates inbound calls, outbound test calls, transcript events, tool execution, human transfer, and call completion.

For Twilio:

1. Set `TELEPHONY_PROVIDER=twilio`.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
3. Configure the inbound voice webhook to `${API_URL}/telephony/twilio/inbound`.
4. Configure status callbacks to `${API_URL}/telephony/twilio/status`.
5. Configure recording callbacks to `${API_URL}/telephony/twilio/recording`.

The API includes signature validation and idempotency handling foundations. Credentials are never exposed to the browser.
